import async_hooks from 'async_hooks';

import {
  PREFIX_RESPONSE_BODY_DATA,
  PREFIX_SERVER_RESPONSE
} from './constants';

import type {
  ObjectForResBodyArg,
  ServerResponseArg,
  ObjectForResBodyBufferItem
} from './types/asyncEventTypes';

type resBodyType = {
  asyncId: number,
  data: ObjectForResBodyBufferItem
}

type serverResType = {
  triggerAsyncId: number,
  data: ServerResponseArg | {
    req: {
      _readableState?: {
        buffer: {
          head: {
            data: string
          }
        }
      }
    }
  }
}

export class OutDoc {
  public static init (): void {
    // Prevent pollute running normal testing
    if (process.env.IS_OUTDOC !== 'true') return

    const asyncHook = async_hooks.createHook({
      init: (
        asyncId: number,
        type: string,
        triggerAsyncId: number,
        resource:  {
          args: Array<ObjectForResBodyArg | ServerResponseArg>
        }
      ) => {
        if (type === "TickObject" && resource.args) {
          const className = resource.args?.[0]?.constructor.name;

          // Response body data
          if (className === "Object") {
            const arg = resource.args[0] as ObjectForResBodyArg;
            if (arg?.stream?.server && arg?.state?.buffered) {
              const dataItem = arg.state.buffered.find(item => {
                if (!item) return false;
                return ['buffer', 'utf-8'].includes(item.encoding);
              });
              if (dataItem) {
                const chunk = dataItem.encoding === 'buffer'
                  ? dataItem.chunk.toString()
                  : dataItem.chunk;
                const res: resBodyType = {
                  asyncId,
                  data: {
                    encoding: dataItem.encoding,
                    chunk
                  }
                };
                process.stderr.write(PREFIX_RESPONSE_BODY_DATA + JSON.stringify(res) + "\n");
              }
            }
          }

          // Server response
          if (className === "ServerResponse") {
            const arg = resource.args[0] as ServerResponseArg;
            const res: serverResType = {
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
            };
            if (arg.req._readableState?.buffer?.head?.data) {
              res.data.req._readableState = {
                buffer: {
                  head: {
                    data: arg.req._readableState.buffer.head.data.toString()
                  }
                }
              };
            }

            process.stderr.write(PREFIX_SERVER_RESPONSE + JSON.stringify(res) + "\n");
          }
        }
      }
    });
    asyncHook.enable();
  }
}
