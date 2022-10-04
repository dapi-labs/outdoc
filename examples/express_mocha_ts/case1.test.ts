import { agent as request } from "supertest";

import app from './src/index'

describe('api testing', () => {
  it('should able to find all', (done) => {
    request(app)
      .get('/api/projects')
      .set('x-api-key', 'wayne-test')
      .expect(200)
      .end(function(err, res) {
        if (err) throw err;
        done()
      });
  })

  it('should able to find one', (done) => {
    request(app)
      .get('/api/projects/uuid-1234')
      .expect(200)
      .end(function(err, res) {
        if (err) throw err;
        done()
      });
  })

  it('should able to find one 401', (done) => {
    request(app)
      .get('/api/projects/401')
      .expect(401)
      .end(function(err, res) {
        if (err) throw err;
        done()
      });
  })

  it('should able to find one 404', (done) => {
    request(app)
      .get('/api/projects/404')
      .expect(404)
      .end(function(err, res) {
        if (err) throw err;
        done()
      });
  })
})