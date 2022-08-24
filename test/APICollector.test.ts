import { expect } from 'chai';
import type { OpenAPIV3_1 } from 'openapi-types';
import cloneDeep from 'lodash.clonedeep';

import {
  rawNodejsServerResponse,
  rawNodejsTickObject,
  expressServerResponse,
  expressTickObject
} from './fixtures/mockAsyncEvent';
import APICollector from '../src/APICollector';

describe("APICollector", () => {
  describe('#addAPIItem', () => {
    let apiCollector: APICollector;

    beforeEach(() => {
      apiCollector = new APICollector();
    });

    it('should able to add request header correctly', (done) => {
      apiCollector.addAPIItem(rawNodejsServerResponse.args[0]);
      const items: Record<string, OpenAPIV3_1.PathItemObject> = apiCollector.getItems();
      const url = Object.keys(items)[0];
      const openAPI = items[url].post;
      const headers = openAPI!.parameters!.filter((parameter: Record<string, any>) => parameter.in === 'header');
      expect(headers).to.be.lengthOf(0);
      done();
    });

    it('should able to add query from raw nodejs correctly', (done) => {
      apiCollector.addAPIItem(rawNodejsServerResponse.args[0]);
      const items: Record<string, OpenAPIV3_1.PathItemObject> = apiCollector.getItems();
      const url = Object.keys(items)[0];
      const openAPI = items[url].post;
      const queries = openAPI!.parameters!.filter((parameter: Record<string, any>) => parameter.in === 'query');
      expect(queries).to.be.lengthOf(1);
      expect(queries[0]).to.have.property('name', 'search');
      expect(queries[0]).to.have.property('example', 'test');
      expect(queries[0]).to.have.deep.property('schema', { type: 'string' });
      done();
    });

    it('should able to add query from express-like framework correctly', (done) => {
      apiCollector.addAPIItem(expressServerResponse.args[0]);
      const items: Record<string, OpenAPIV3_1.PathItemObject> = apiCollector.getItems();
      const url = Object.keys(items)[0];
      const openAPI = items[url].post;
      const queries = openAPI!.parameters!.filter((parameter: Record<string, any>) => parameter.in === 'query');
      expect(queries).to.be.lengthOf(1);
      expect(queries[0]).to.have.property('name', 'search');
      expect(queries[0]).to.have.property('example', 'testdapi');
      expect(queries[0]).to.have.deep.property('schema', { type: 'string' });
      done();
    });

    it('should able to add params correctly, only works for non-raw nodejs', (done) => {
      apiCollector.addAPIItem(expressServerResponse.args[0]);
      const items: Record<string, OpenAPIV3_1.PathItemObject> = apiCollector.getItems();
      const url = Object.keys(items)[0];
      expect(url).to.contain.oneOf(['{id}']);

      const openAPI = items[url].post;
      const paths = openAPI!.parameters!.filter((parameter: Record<string, any>) => parameter.in === 'path');
      expect(paths).to.be.lengthOf(1);
      expect(paths[0]).to.have.property('name', 'id');
      expect(paths[0]).to.have.property('required', true);
      expect(paths[0]).to.have.property('example', '5992f2f2-a3ef-4841-9bf8-102c9a701d2e');
      expect(paths[0]).to.have.deep.property('schema', { type: 'string' });
      done();
    });

    it('should able to add request body from raw nodejs correctly', (done) => {
      apiCollector.addAPIItem(rawNodejsServerResponse.args[0]);
      const items: Record<string, OpenAPIV3_1.PathItemObject> = apiCollector.getItems();
      const url = Object.keys(items)[0];
      const openAPI = items[url].post;
      const requestBody = openAPI!.requestBody;
      expect(requestBody).to.not.be.undefined;
      expect(requestBody).to.have.deep.property('content', {
        "application/x-www-form-urlencoded": {
          schema: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                example: 'dapi'
              }
            }
          }
        }
      });
      done();
    });

    it('should able to add request body express-like framework correctly', (done) => {
      apiCollector.addAPIItem(expressServerResponse.args[0]);
      const items: Record<string, OpenAPIV3_1.PathItemObject> = apiCollector.getItems();
      const url = Object.keys(items)[0];
      const openAPI = items[url].post;
      const requestBody = openAPI!.requestBody;
      expect(requestBody).to.not.be.undefined;
      expect(requestBody).to.have.deep.property('content', {
        "application/json": {
          schema: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                example: 'dapi v2'
              }
            }
          }
        }
      });
      done();
    });

    it('should able to add response correctly from raw nodejs correctly', (done) => {
      apiCollector.addAPIItem(
        rawNodejsServerResponse.args[0],
        rawNodejsTickObject.args[0].state.buffered[0]
      );
      const items: Record<string, OpenAPIV3_1.PathItemObject> = apiCollector.getItems();
      const url = Object.keys(items)[0];
      const openAPI = items[url].post;
      const responses = openAPI!.responses;
      expect(responses).to.have.deep.property('200', {
        description: "OK",
        content: {
          "text/plain": {
            schema: {
              type: 'string',
              example: 'plain test response'
            }
          }
        }
      });
      done();
    });

    it('should able to add response correctly from express-like framework correctly', (done) => {
      apiCollector.addAPIItem(
        expressServerResponse.args[0],
        expressTickObject.args[0].state.buffered[1]
      );
      const items: Record<string, OpenAPIV3_1.PathItemObject> = apiCollector.getItems();
      const url = Object.keys(items)[0];
      const openAPI = items[url].post;
      const responses = openAPI!.responses;
      expect(responses).to.have.deep.property('200', {
        description: "OK",
        content: {
          "application/json": {
            schema: {
              type: 'object',
              properties: {
                data: {
                  type: 'object',
                  properties: {
                    name: {
                      type: 'string',
                      example: 'dapi-res'
                    }
                  }
                }
              }
            }
          }
        }
      });
      done();
    });

    it('should able to add different method to the same API url', (done) => {
      const rawNodejsServerResponseForGET = cloneDeep(rawNodejsServerResponse);
      rawNodejsServerResponseForGET.args[0].req.method = 'GET' as OpenAPIV3_1.HttpMethods;

      apiCollector.addAPIItem(rawNodejsServerResponse.args[0]);
      apiCollector.addAPIItem(rawNodejsServerResponseForGET.args[0]);

      const items: Record<string, OpenAPIV3_1.PathItemObject> = apiCollector.getItems();
      const url = Object.keys(items)[0];
      expect(Object.keys(items[url])).to.be.lengthOf(2);
      expect(items[url]).to.have.all.keys('get', 'post');
      done();
    });

    it('should able to add different status response to the same API', (done) => {
      const rawNodejsServerResponseForFailed = cloneDeep(rawNodejsServerResponse);
      rawNodejsServerResponseForFailed.args[0].statusCode = 403;

      apiCollector.addAPIItem(rawNodejsServerResponse.args[0]);
      apiCollector.addAPIItem(rawNodejsServerResponseForFailed.args[0]);

      const items: Record<string, OpenAPIV3_1.PathItemObject> = apiCollector.getItems();
      const url = Object.keys(items)[0];
      const openAPI = items[url].post;
      const responses = openAPI!.responses;
      expect(Object.keys(responses)).to.be.lengthOf(2);
      expect(responses).to.have.all.keys('200', '403');
      done();
    });
  });
});
