const request = require('supertest');

const app = require('./index.js');

describe('api testing', () => {
  it('should able to find all', (done) => {
    request(app)
      .get('/projects')
      .set('x-api-key', 'outdoc-test')
      .expect(200)
      .end(function(err, res) {
        if (err) throw err;
        done();
      });
  });

  it('should able to find one', (done) => {
    request(app)
      .get('/projects/uuid-1234')
      .expect(200)
      .end(function(err, res) {
        if (err) throw err;
        done();
      });
  });

  it('should able to find one 401', (done) => {
    request(app)
      .get('/projects/401')
      .expect(401)
      .end(function(err, res) {
        if (err) throw err;
        done();
      });
  });

  it('should able to find one 404', (done) => {
    request(app)
      .get('/projects/404')
      .expect(404)
      .end(function(err, res) {
        if (err) throw err;
        done();
      });
  });

  describe('users', () => {
    it('should able to find one user', (done) => {
      request(app)
        .get('/users/user-wayne')
        .expect(200)
        .end(function(err, res) {
          if (err) throw err;
          done();
        });
    });

    it('should able to post', (done) => {
      request(app)
        .post('/users')
        .set('content-type', 'application/json')
        .send({
          name: 'user wayne'
        })
        .expect(201)
        .end(function(err, res) {
          if (err) throw err;
          done();
        });
    });
  });
});