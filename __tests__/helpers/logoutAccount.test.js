const app = require('../../server');
const request = require('supertest');

// @desc test plan to test the logout account of the driver account

describe('Helper Loguout tests', () => {
  token = null;
  beforeAll(async (done) =>{
    request(app)
      .post('/api/helpers/login')
      .send({ email:"test@email.com", password: "testpassword" })
      .end((err, res)=> {
        token = res.body.token;
        done();
      });
  });
  /*@test Test Case 1
    Description  : Helper account logout
    Expected output : JSON returned with 200 status 
  */
  it('Should logout of the Helper Account', async (done) => {
    const response = await request(app).get('/api/helpers/logout').set('x-auth-token', token);
    expect(response.statusCode).toEqual(200);
    done();
  });

  /*@test Test Case 2
    Description  : Should return 200 if the token is provided while logout but that token was already invalidated 
    Expected output : JSON returned with 200 status
  */
  it('Should return 200 if the token is provided while logout but that token was already invalidated ', async (done) => {
    const response = await request(app).get('/api/helpers/logout').set('x-auth-token', token);
    expect(response.statusCode).toEqual(200);
    done();
  });

  /*@test Test Case 3
    Description  : Check if it returns status 400 because token was not provided by the user/client
    Expected output : JSON returned with 400 status
  */
  it('Check if it returns status 400 because token was not provided by the user/client', async (done) => {
    const response = await request(app).get('/api/helpers/logout');
    expect(response.statusCode).toEqual(400);
    done();
  });

});
