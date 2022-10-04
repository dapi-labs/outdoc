const supertest = require('supertest');
const app = require('./index.js')
const request = supertest(app)

describe('api testing', () => {
  test('should able to find all', (done) => {
    request
      .get('/projects')
      .set('x-api-key', 'wayne-test')
      .expect(200)
      .end(function(err, res) {
        if (err) throw err;
        done()
      });
  })
})