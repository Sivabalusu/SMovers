const app = require('../../server');
const request = require('supertest');

// @desc test plan to test the logout account of the driver account

describe('Driver Get endpoints', () => {
  /*@test Test Case 1
    Description  : Driver account logout
    Expected output : JSON returned with 200 status 
  */
  it('Should logout of the Driver Account', async (done) => {
    const response = await request(app).post('/api/drivers/logout').send({
    });
    expect(response.statusCode).toEqual(200);
    done();
  });

  /*@test Test Case 2
    Description  : Avoid any activity from an Driver account which is already logged out
    Expected output : JSON returned with 200 status
  */
  it('Check if it returns status 200 because activity attempted on logged out account', async (done) => {
    const response = await request(app).post('/api/drivers/logout').send({
    });
    expect(response.statusCode).toEqual(200);
    done();
  });

  /*@test Test Case 3
    Description  : Check if it fails when unexpected activity attempted on Driver Account
    Expected output : JSON returned with 400 status
  */
  it('Check if it returns status 400 because unexpected activity attempted on driver account', async (done) => {
    const response = await request(app).post('/api/drivers/logout').send({
    });
    expect(response.statusCode).toEqual(400);
    done();
  });

});
