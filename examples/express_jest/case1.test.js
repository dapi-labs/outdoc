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

  test('should able to find one', (done) => {
    request
      .get('/projects/uuid-1234')
      .expect(200)
      .end(function(err, res) {
        if (err) throw err;
        done()
      });
  })

  test('should able to find one 401', (done) => {
    request
      .get('/projects/401')
      .expect(401)
      .end(function(err, res) {
        if (err) throw err;
        done()
      });
  })

  test('should able to find one 404', (done) => {
    request
      .get('/projects/404')
      .expect(404)
      .end(function(err, res) {
        if (err) throw err;
        done()
      });
  })

  describe('users', () => {
    test('should able to find one user', (done) => {
      request
        .get('/users/user-wayne')
        .expect(200)
        .end(function(err, res) {
          if (err) throw err;
          done()
        });
    })

    test('should able to post', (done) => {
      request
        .post('/users')
        .set('content-type', 'application/json')
        .send({
          name: 'user wayne'
        })
        .expect(201)
        .end(function(err, res) {
          if (err) throw err;
          done()
        });
    })
  })
})