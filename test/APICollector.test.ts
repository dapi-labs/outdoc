import { expect } from 'chai';
import type { OpenAPIV3_1 } from 'openapi-types';

import { rawNodejsServerResponse, expressServerResponse } from './fixtures/mockAsyncEvent';
import APICollector from '../src/APICollector';

describe("APICollector", () => {
  describe('#addAPIItem', () => {
    let apiCollector: APICollector

    beforeEach(() => {
      apiCollector = new APICollector();
    })

    it('should able to add request header correctly', (done) => {
      apiCollector.addAPIItem(rawNodejsServerResponse.args[0]);
      const items: Record<string, OpenAPIV3_1.PathItemObject> = apiCollector.getItems();
      const url = Object.keys(items)[0]
      const openAPI = items[url].post
      const headers = openAPI!.parameters!.filter((parameter: Record<string, any>) => parameter.in === 'header')
      expect(headers).to.be.lengthOf(1)
      expect(headers[0]).to.have.property('name', 'Content-Type')
      expect(headers[0]).to.have.property('example', 'application/x-www-form-urlencoded')
      expect(headers[0]).to.have.deep.property('schema', { type: 'string' })
      done()
    })

    it('should able to add query from raw nodejs correctly', (done) => {
      apiCollector.addAPIItem(rawNodejsServerResponse.args[0]);
      const items: Record<string, OpenAPIV3_1.PathItemObject> = apiCollector.getItems();
      const url = Object.keys(items)[0]
      const openAPI = items[url].post
      const queries = openAPI!.parameters!.filter((parameter: Record<string, any>) => parameter.in === 'query')
      expect(queries).to.be.lengthOf(1)
      expect(queries[0]).to.have.property('name', 'search')
      expect(queries[0]).to.have.property('example', 'test')
      expect(queries[0]).to.have.deep.property('schema', { type: 'string' })
      done()
    })

    it('should able to add query from express-like framework correctly', (done) => {
      apiCollector.addAPIItem(expressServerResponse.args[0]);
      const items: Record<string, OpenAPIV3_1.PathItemObject> = apiCollector.getItems();
      const url = Object.keys(items)[0]
      const openAPI = items[url].post
      const queries = openAPI!.parameters!.filter((parameter: Record<string, any>) => parameter.in === 'query')
      expect(queries).to.be.lengthOf(1)
      expect(queries[0]).to.have.property('name', 'search')
      expect(queries[0]).to.have.property('example', 'testdapi')
      expect(queries[0]).to.have.deep.property('schema', { type: 'string' })
      done()
    })

    // it('should able to add params correctly', (done) => {})
    // it('should able to add request body correctly', (done) => {})
    // it('should able to add response correctly', (done) => {})
    // it('should able to add different status response to the same API', () => {})

  });
});
