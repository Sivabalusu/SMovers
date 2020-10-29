const app = require('../../server');
const request = require('supertest');

// @desc test plan to test the login account functionality for the helper

describe('Helper Post endpoints', () => {
    /*@test Test Case 1
        Description  : Check the actual functionality by providing email and password
        Input : Email:test@email.com,
                Password: test,
        Expected output : JSON returned with 200 status 
    */

   it('Should login user to system and return a web token', async (done) => {
    const response = await request(app).post('/api/helpers/login').send({
        email:'test@email.com',
        password: 'testpassword',
    });
    expect(response.statusCode).toEqual(200);
    done();
  });

    /*@test Test Case 2
    Description  : Check it fails if no password provided
    Input : Email:test@email.com,
     Expected output : JSON returned with 400 status 
    */

    it('Check it fails as user does not provide password', async (done) => {
    const response = await request(app).post('/api/helpers/login').send({
        email:'test@email.com',
    });
    expect(response.statusCode).toEqual(400);
    done();
    });

    /*@test Test Case 3
    Description  : Check it fails if no email provided
    Input : Password: test password,
     Expected output : JSON returned with 400 status 
    */
    
    it('Check it fails as user does not provide email', async (done) => {
    const response = await request(app).post('/api/helpers/login').send({
        password: 'testpassword',
    });
    expect(response.statusCode).toEqual(400);
    done();
    });

    /*@test Test Case 4
    Description  : Check it fails if no email and password provided
    Input :
     Expected output : JSON returned with 400 status 
    */
    
    it('Check it fails as user does not provide email and password', async (done) => {
    const response = await request(app).post('/api/helpers/login').send({});
    expect(response.statusCode).toEqual(400);
    done();
    });

    /*@test Test Case 5
    Description  : Check it fails if user provides incorrect email and password
    Input : Email:test123@gmail.com
            Password: test123,
     Expected output : JSON returned with 400 status 
    */
    
    it('Check it fails if user provides incorrect email and password', async (done) => {
    const response = await request(app).post('/api/helpers/login').send({
        email:'test123@gmail.com',
        password: 'test123',
    });
    expect(response.statusCode).toEqual(400);
    done();
    });

    /*@test Test Case 6
    Description  : Check it fails if user provides incorrect email format 
    Input : Email:test
            Password: test,
     Expected output : JSON returned with 400 status 
    */
    
    it('Check it fails if user provides incorrect email format', async (done) => {
    const response = await request(app).post('/api/helpers/login').send({
        email:'test',
        password: 'testpassword',
    });
    expect(response.statusCode).toEqual(400);
    done();
    });
});
