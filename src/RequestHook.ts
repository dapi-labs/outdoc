import {
  PREFIX_RESPONSE_BODY_DATA,
  PREFIX_SERVER_RESPONSE
} from './constants';
import type {
  ObjectForResBodyBufferItem,
  ServerResponseArg
} from './types/asyncEventTypes';
import type APICollector from './APICollector';

/**
 * The response body data comes before ServerResponse event
 * The ServerResponse event will tell which asyncId it triggered
 * By this way we can get the full response
 */
type EventMap = Record<number, ObjectForResBodyBufferItem | undefined>

type ResponseBodyDataFromChildProcess = {
  asyncId: number,
  data: ObjectForResBodyBufferItem
}

type ServerResponseFromChildProcess = {
  triggerAsyncId: number,
  data: ServerResponseArg
}

export default class RequestHook {
  private eventMap: EventMap;

  public static getInjectedCodes (): string {
    return `
      const async_hooks = require('async_hooks')
      const asyncHook = async_hooks.createHook({
        init: (asyncId, type, triggerAsyncId, resource) => {
          if (type === "TickObject" && resource.args) {
            const className = resource.args?.[0]?.constructor.name;

            // Response body data
            if (className === "Object") {
              const arg = resource.args[0]
              if (arg?.stream?.server && arg?.state?.buffered) {
                const dataItem = arg.state.buffered.find(item => {
                  if (!item) return false
                  return ['buffer', 'utf-8'].includes(item.encoding)
                })
                if (dataItem) {
                  const chunk = dataItem.encoding === 'buffer'
                    ? dataItem.chunk.toString()
                    : dataItem.chunk
                  const res = {
                    asyncId,
                    data: {
                      encoding: dataItem.encoding,
                      chunk
                    }
                  }
                  console.log("${PREFIX_RESPONSE_BODY_DATA}" + JSON.stringify(res))
                }
              }
            }

            // Server response
            if (className === "ServerResponse") {
              const arg = resource.args[0];
              const res = {
                triggerAsyncId,
                data: {
                  _header: arg._header,
                  statusCode: arg.statusCode,
                  statusMessage: arg.statusMessage,
                  req: {
                    rawHeaders: arg.req.rawHeaders,
                    url: arg.req.url,
                    method: arg.req.method,
                    params: arg.req.params,
                    query: arg.req.query,
                    baseUrl: arg.req.baseUrl,
                    originalUrl: arg.req.originalUrl,
                    body: arg.req.body
                  }
                }
              }
              if (arg.req._readableState?.buffer?.head?.data) {
                res.data.req._readableState = {
                  buffer: {
                    head: {
                      data: arg.req._readableState.buffer.head.data.toString()
                    }
                  }
                }
              }
              console.log("${PREFIX_SERVER_RESPONSE}" + JSON.stringify(res))
            }
          }
        }
      });
      asyncHook.enable();
    `;
  }

  constructor (private apiCollector: APICollector) {
    this.eventMap = {};
  }

  public handleResponseBodyData (res: ResponseBodyDataFromChildProcess): void {
    this.eventMap[res.asyncId] = res.data;
  }

  public handleServerResponse (res: ServerResponseFromChildProcess): void {
    const triggerAsyncId = res.triggerAsyncId;
    const responseBodyData = this.eventMap[triggerAsyncId];
    this.apiCollector.addAPIItem(res.data, responseBodyData);
    delete this.eventMap[triggerAsyncId];
  }
}
