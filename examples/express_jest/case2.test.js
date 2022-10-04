const supertest = require('supertest');
const app = require('./index.js')
const request = supertest(app)

describe('api testing', () => {
  test('should able to path', (done) => {
    request
      .patch('/projects/uuid-1234')
      .set('content-type', 'application/json')
      .set('Accept', 'application/json')
      .send({
        project: {
          tags: ['2016', '2017']
        }
      })
      .expect(200)
      .end(function(err, res) {
        if (err) throw err;
        done()
      });
  })

  test('should able to delete', (done) => {
    request
      .delete('/projects/uuid-2')
      .expect(204)
      .end(function(err, res) {
        if (err) throw err;
        done()
      });
  })
})