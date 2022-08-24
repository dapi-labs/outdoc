import type { OpenAPIV3_1 } from 'openapi-types';
import type { ServerResponseArg, ObjectForResBodyBufferItem } from './types/asyncEventTypes';

export type API_URL = string

export interface APICollectorInterface {
  addAPIItem(
    serverResponse: ServerResponseArg,
    resBody?: ObjectForResBodyBufferItem
  ): void;

  getItems(): Record<API_URL, OpenAPIV3_1.PathItemObject>;
}
