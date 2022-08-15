import async_hooks, { AsyncHook } from 'async_hooks';
import type {
  ObjectForResBodyArg,
  ObjectForResBodyBufferItem,
  ServerResponseArg
} from './types/asyncEventTypes';
import APICollector from './APICollector';

/**
 * The response body data comes before ServerResponse event
 * The ServerResponse event will tell which asyncId it triggered
 * By this way we can get the full API data including req and res
 */
type EventMap = Record<number, ObjectForResBodyBufferItem | undefined>

export default class RequestHook {
  private asyncHook: AsyncHook | null;
  private eventMap: EventMap;
  private apiCollector: APICollector;

  constructor () {
    this.asyncHook = null;
    this.eventMap = {};
    this.apiCollector = new APICollector();
  }

  public enable (): void {
    this.asyncHook = async_hooks.createHook({ init: this.init });
    this.asyncHook.enable();
  }

  public disable (): void {
    if (this.asyncHook) {
      this.asyncHook.disable();
      this.asyncHook = null;
    }
  }

  private extractResBody (arg: ObjectForResBodyArg): ObjectForResBodyBufferItem | undefined {
    return arg.state.buffered.find(item => ['buffer', 'utf-8'].includes(item.encoding));
  }

  private init (
    asyncId: number,
    type: string,
    triggerAsyncId: number,
    resource: {
      args: Array<ObjectForResBodyArg | ServerResponseArg>
    }
  ): void {
    if (type === "TickObject" && resource.args) {
      const className = resource.args?.[0]?.constructor.name;

      // Check if it is response data, save it into eventMap
      if (className === "Object") {
        const myArg = resource.args[0] as ObjectForResBodyArg;
        if (myArg?.stream?.server) {
          this.eventMap[asyncId] = this.extractResBody(myArg);
        }
      }

      // Check if it is server response, pass it to APICollector
      if (className === "ServerResponse") {
        const myArg = resource.args[0] as ServerResponseArg;
        const responseBodyData = this.eventMap[triggerAsyncId];
        this.apiCollector.addAPIItem(myArg, responseBodyData);
        delete this.eventMap[triggerAsyncId];
      }
    }
  }
}
