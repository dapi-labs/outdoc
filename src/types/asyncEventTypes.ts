import type { OpenAPIV3_1 } from 'openapi-types';

export type ObjectForResBodyBufferItem = {
  chunk: string | Buffer,
  encoding: 'utf-8' | 'buffer' | 'latin1'
}

export type ObjectForResBodyArg = {
  stream: {
    server?: any
  },
  state: {
    buffered: Array<ObjectForResBodyBufferItem>
  }
}

export type ServerResponseArg = {
  _header: string,
  statusCode: number,
  statusMessage: string,
  req: {
    rawHeaders: Array<string>,
    url: string,
    method: OpenAPIV3_1.HttpMethods,
    params?: Record<string, string>,
    query?: Record<string, string>,
    baseUrl?: string,
    originalUrl?: string,
    body?: Record<string, any>,
    _readableState?: {
      buffer: {
        head: {
          data: Buffer,
          next: any
        }
      }
    }
  }
}
