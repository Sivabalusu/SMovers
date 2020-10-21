const app = require('../../server');
const request = require('supertest');

// @desc test plan to test the login account functionality for the driver

describe('Driver Post endpoints', () => {
    /*@test Test Case 1
        Description  : Check the actual functionality by providing email and password
        Input : Email:test@email.com,
                Password: test,
        Expected output : JSON returned with 200 status 
    */

   it('Should login user to system and return a web token', async (done) => {
    const response = await request(app).post('/api/drivers/login').send({
        Email:'test@email.com',
        Password: 'test',
    });
    expect(response.statusCode).toEqual(200);
    done();
  });

    /*@test Test Case 2
    Description  : Check it fails if no password provided
    Input : Email:test@email.com,
     Expected output : JSON returned with 400 status 
    */

    it('Should login user to system and return a web token', async (done) => {
    const response = await request(app).post('/api/drivers/login').send({
        Email:'test@email.com',
    });
    expect(response.statusCode).toEqual(400);
    done();
    });

    /*@test Test Case 3
    Description  : Check it fails if no email provided
    Input : Password: test password,
     Expected output : JSON returned with 400 status 
    */
    
    it('Should login user to system and return a web token', async (done) => {
    const response = await request(app).post('/api/drivers/login').send({
        Password: 'test',
    });
    expect(response.statusCode).toEqual(400);
    done();
    });
});
