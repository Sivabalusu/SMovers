const app = require('../server');
const request = require('supertest');

describe('Booker Post endpoints', () => {
  it('Should create a new user and return a web token', async (done) => {
    const response = await request(app).post('/api/bookers').send({
      name: 'Test Booker',
      email: 'test3@gmail.com',
      password: 'test8586',
    });
    expect(response.statusCode).toEqual(200);
    done();
  });
  it('Should create a new user and return a web token', async (done) => {
    const response = await request(app).post('/api/bookers').send({
      name: 'Test Booker',
      email: 'test2@gmail.com',
      password: 'test8586',
    });
    expect(response.statusCode).toEqual(200);
    done();
  });
});
