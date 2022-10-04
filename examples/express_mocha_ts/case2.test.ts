import { agent as request } from "supertest";

import app from './src/index'

describe('api testing', () => {
  it('should able to path', (done) => {
    request(app)
      .patch('/api/projects/uuid-1234')
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

  it('should able to post', (done) => {
    request(app)
      .post('/api/projects')
      .set('content-type', 'application/json')
      .set('x-api-key', 'wayne-test')
      .send({
        name: 'john'
      })
      .expect(201)
      .end(function(err, res) {
        if (err) throw err;
        done()
      });
  })

  it('should able to delete', (done) => {
    request(app)
      .delete('/api/projects/uuid-2')
      .expect(204)
      .end(function(err, res) {
        if (err) throw err;
        done()
      });
  })
})

