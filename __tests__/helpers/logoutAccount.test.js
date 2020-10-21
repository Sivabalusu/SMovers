const app = require('../../server');
const request = require('supertest');

// @desc test plan to test the logout account of the helper account

describe('Helper Get endpoints', () => {
  /*@test Test Case 1
    Description  : Helper account logout
    Expected output : JSON returned with 200 status 
  */
  it('Should logout of the Helper Account', async (done) => {
    const response = await request(app).post('/api/helper/logout').send({
    });
    expect(response.statusCode).toEqual(200);
    done();
  });

  /*@test Test Case 2
    Description  : Avoid any activity from an Helper account which is already logged out
    Expected output : JSON returned with 200 status
  */
  it('Check if it returns status 200 because activity attempted on logged out account', async (done) => {
    const response = await request(app).post('/api/helper/logout').send({
    });
    expect(response.statusCode).toEqual(200);
    done();
  });

  /*@test Test Case 3
    Description  : Check if it fails when unexpected activity attempted on Helper Account
    Expected output : JSON returned with 400 status
  */
  it('Check if it returns status 400 because unexpected activity attempted on helper account', async (done) => {
    const response = await request(app).post('/api/helper/logout').send({
    });
    expect(response.statusCode).toEqual(400);
    done();
  });

});
