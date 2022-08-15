import { expect } from 'chai';

import APICollector from '../src/APICollector';

import { expressServerResponse, expressTickObject } from './fixtures/mockAsyncEvent';

describe("APICollector", () => {
  const apiCollector = new APICollector();

  describe('#addAPIItem', () => {
    it('should able to extra method from async event', (done) => {
      apiCollector.addAPIItem(
        expressServerResponse.args[0],
        expressTickObject.args[0].state.buffered[1]
      );
      const res = apiCollector.getItems();
      const item = res['/api/endpoints/projects/5992f2f2-a3ef-4841-9bf8-102c9a701d2e'].post;
      console.dir(item);
      done();
    });
  });
});
