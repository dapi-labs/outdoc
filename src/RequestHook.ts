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
      const { OutDoc } = require('outdoc');
      OutDoc.init();
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
  }
}
