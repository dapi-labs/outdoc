import url from 'url';
import qs from 'qs';
import contentType from 'content-type';
import type { OpenAPIV3_1 } from 'openapi-types';
import type { ServerResponseArg, ObjectForResBodyBufferItem } from './types/asyncEventTypes';
import type { API_URL } from './types/apiTypes';

export default class APICollector {
  private items: Record<API_URL, OpenAPIV3_1.PathItemObject>;

  constructor () {
    this.items = {};
  }

  /**
   * Using OpenAPIV3_1.SchemaObject as return type throws error
   * No idea how to deal with it
   * Reference:
   * https://github.com/kogosoftwarellc/open-api/blob/master/packages/openapi-types/index.ts#L138-L146
   */
  private genSchema (data: any, withExample = true): Record<string, any> {
    if (!data) return {};
    switch (Object.prototype.toString.call(data)) {
      case "[object Object]": {
        const properties: Record<string, any> = {};
        Object.entries(data).forEach(([key, value]) => {
          properties[key] = this.genSchema(value, withExample);
        });
        return {
          type: 'object',
          properties
        };
      }
      case "[object Array]": {
        const items = this.genSchema(data[0], withExample);
        return {
          type: 'array',
          items
        };
      }
      default: {
        const res: Record<string, any> = {
          type: typeof data
        };
        if (withExample) {
          res.example = data;
        }
        return res;
      }
    }
  }

  private extractMethod (serverRes: ServerResponseArg): OpenAPIV3_1.HttpMethods {
    return <OpenAPIV3_1.HttpMethods>serverRes.req.method.toLowerCase();
  }

  private extractURL (serverRes: ServerResponseArg): string | undefined {
    const parsedURL = url.parse(serverRes.req.originalUrl || serverRes.req.url);
    let path = parsedURL.pathname;
    if (!path) return;
    if (serverRes.req.params) {
      // convert /path/xxx-xxx-xxx-xxx => /path/{id}
      Object.entries(serverRes.req.params).forEach(([key, value]) => {
        path = path!.replace(value, `{${key}}`);
      });
    }
    return path;
  }

  private genHeaderObjFromRawHeaders (
    rawHeaders: Array<string>,
    { exclude, lower }: { exclude?: Array<string>, lower?: boolean } = {}
  ): Record<string, string> {
    const headers: Record<string, string> = {};
    for (let i = 0; i < rawHeaders.length; i += 2) {
      const headerName = lower && rawHeaders[i].toLowerCase() || rawHeaders[i];
      const headerValue = rawHeaders[i + 1];
      if (exclude?.includes(headerName.toLowerCase())) continue;
      headers[headerName] = headerValue;
    }
    return headers;
  }

  private extractHeaders (serverRes: ServerResponseArg): Array<OpenAPIV3_1.ParameterObject> {
    const excludeHeaders = [
      'host',
      'user-agent',
      'content-length',
      'content-type',
      'accept',
      'connection',
      'accept-encoding'
    ];
    const headers = this.genHeaderObjFromRawHeaders(
      serverRes.req.rawHeaders,
      { exclude: excludeHeaders }
    );
    return Object.entries(headers)
      .map(([key, value]) => ({
        in: 'header',
        name: key,
        example: value,
        schema: {
          type: 'string'
        }
      }));
  }

  private extractQueries (serverRes: ServerResponseArg): Array<OpenAPIV3_1.ParameterObject> {
    let query: Record<string, any> | undefined = serverRes.req.query;
    if (!query) {
      const parsedURL = url.parse(serverRes.req.url);
      if (parsedURL.query) {
        query = qs.parse(parsedURL.query);
      }
    }

    if (!query) return [];
    return Object.entries(query).map(([key, value]) => ({
      in: 'query',
      name: key,
      example: typeof value === "object" && JSON.stringify(value) || value,
      schema: this.genSchema(value, false)
    }));
  }

  private extractParams (serverRes: ServerResponseArg): Array<OpenAPIV3_1.ParameterObject> {
    if (!serverRes.req.params) return [];
    return Object.entries(serverRes.req.params).map(([key, value]) => ({
      in: 'path',
      name: key,
      required: true,
      example: value,
      schema: {
        type: 'string'
      }
    }));
  }

  private extractRequestBody (serverRes: ServerResponseArg): OpenAPIV3_1.RequestBodyObject | undefined {
    let requestBodyData = serverRes.req.body;
    if (!requestBodyData) {
      const headData = serverRes.req._readableState?.buffer.head.data;
      if (headData) {
        requestBodyData = JSON.parse(headData.toString());
      }
    }

    if (!requestBodyData) return;
    const reqHeaders = this.genHeaderObjFromRawHeaders(serverRes.req.rawHeaders, { lower: true });
    const reqBodyContentType = reqHeaders['content-type']
      ? contentType.parse(reqHeaders['content-type'].toLowerCase()).type
      : 'application/json';
    return {
      content: {
        [reqBodyContentType]: {
          schema: this.genSchema(requestBodyData)
        }
      }
    };
  }

  private genHeaderObjFromResponse (resHeaderStr: string): Record<string, string> {
    const headers = resHeaderStr.split("\r\n\r\n")[0];
    return headers
      .split("\r\n")
      .slice(1) // The first http header is "HTTP/1.1 xxx xx"
      .reduce((headers, headerStr) => {
        const [key, value] = headerStr.split(":");
        headers[key.trim().toLowerCase()] = value.trim();
        return headers;
      }, {} as Record<string, string>);
  }

  private genResBodyData (resBody: ObjectForResBodyBufferItem): Record<string, any> | string {
    let dataStr;
    switch (resBody.encoding) {
      case 'utf-8': {
        const chunk = resBody.chunk as string;
        dataStr = chunk.split("\r\n\r\n")[1];
        break;
      }
      case 'buffer': {
        const chunk = resBody.chunk as Buffer;
        dataStr = chunk.toString();
        break;
      }
      default: {
        dataStr = '';
      }
    }

    try {
      return JSON.parse(dataStr);
    } catch (err) {
      return dataStr;
    }
  }

  private extractResponseItem (
    serverRes: ServerResponseArg,
    resBody?: ObjectForResBodyBufferItem
  ): OpenAPIV3_1.ResponsesObject {
    const statusCode = serverRes.statusCode;
    if (!resBody) {
      return {
        [String(statusCode)]: {
          description: 'No response data'
        }
      };
    }

    const resHeaders = this.genHeaderObjFromResponse(serverRes._header);
    const resContentType = resHeaders['content-type']
      ? contentType.parse(resHeaders['content-type'].toLowerCase()).type
      : 'application/json';
    const resData = this.genResBodyData(resBody);
    return {
      [String(statusCode)]: {
        description: serverRes.statusMessage,
        content: {
          [resContentType]: {
            schema: this.genSchema(resData)
          }
        }
      }
    };
  }

  private insertNewAPIItem (
    url: API_URL,
    method: OpenAPIV3_1.HttpMethods,
    methodContent: OpenAPIV3_1.OperationObject,
    statusCode: number
  ): void {
    // If the url method doesnt exist
    if (!this.items[url] || !this.items[url][method]) {
      this.items[url] = this.items[url] || {};
      Object.assign(
        this.items[url],
        { [method]: methodContent }
      );
      return;
    }

    // TODO: oneOf for parameters, requestBody and responses

    // For invalid and proxy request, we only save its response
    if (statusCode >= 300) {
      Object.assign(
        this.items[url][method]!.responses,
        methodContent.responses
      );
      return;
    }

    const newResponses = Object.assign(
      {},
      this.items[url][method]!.responses,
      methodContent.responses
    );
    this.items[url][method] = Object.assign(
      {},
      methodContent,
      { responses: newResponses }
    );
  }

  public addAPIItem(
    serverResponse: ServerResponseArg,
    resBody?: ObjectForResBodyBufferItem
  ): void {
    const statusCode = serverResponse.statusCode;
    const url = this.extractURL(serverResponse);
    if (!url) throw new Error('No url found');
    const method = this.extractMethod(serverResponse);
    const operationObj: OpenAPIV3_1.OperationObject = {};
    const methodsHasReqBody = ['post', 'put'];

    if (statusCode < 400) {
      const headers = this.extractHeaders(serverResponse);
      const queries = this.extractQueries(serverResponse);
      const params = this.extractParams(serverResponse);
      const parameters = headers.concat(queries).concat(params);
      if (parameters.length > 0) {
        operationObj.parameters = parameters;
      }

      if (methodsHasReqBody.includes(method)) {
        const requestBody = this.extractRequestBody(serverResponse);
        if (requestBody) {
          operationObj.requestBody = requestBody;
        }
      }
    }

    const responses = this.extractResponseItem(serverResponse, resBody);
    operationObj.responses = responses;

    this.insertNewAPIItem(url, method, operationObj, statusCode);
  }

  public getItems(): Record<API_URL, OpenAPIV3_1.PathItemObject> {
    return this.items;
  }
}

