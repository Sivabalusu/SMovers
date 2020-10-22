const app = require('../../server');
const request = require('supertest');

// @desc test plan to test the login account functionality for the booker

describe('Booker Post endpoints', () => {
    /*@test Test Case 1
        Description  : Check the actual functionality by providing email and password
        Input : Email,
                Password,
        Expected output : JSON returned with 200 status 
    */

   it('Should login user to system and return a web token', async (done) => {
    const response = await request(app).post('/api/bookers/login').send({
        email:'test@abc.com',
        password: 'test@abc.com',
    });
    expect(response.statusCode).toEqual(200);
    done();
  });

    /*@test Test Case 2
    Description  : Check it fails if no password provided
    Input : Email
     Expected output : JSON returned with 400 status 
    */

    it('Check it fails as user does not provide password', async (done) => {
    const response = await request(app).post('/api/bookers/login').send({
        email:'test@abc.com',
    });
    expect(response.statusCode).toEqual(400);
    done();
    });

    /*@test Test Case 3
    Description  : Check it fails if no email provided
    Input : Password
     Expected output : JSON returned with 400 status 
    */
    
    it('Check it fails as user does not provide email', async (done) => {
    const response = await request(app).post('/api/bookers/login').send({
        password: 'test@abc.com',
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
    const response = await request(app).post('/api/bookers/login').send({});
    expect(response.statusCode).toEqual(400);
    done();
    });

    /*@test Test Case 5
    Description  : Check it fails if user provides incorrect  password
    Input : Email
            Password
     Expected output : JSON returned with 400 status 
    */
    
    it('Check it fails if user provides incorrect password', async (done) => {
    const response = await request(app).post('/api/bookers/login').send({
        email:'test@abc.com',
        password: 'test123',
    });
    expect(response.statusCode).toEqual(400);
    done();
    });

    /*@test Test Case 6
    Description  : Check it fails if user provides email
    Input : Email
            Password
     Expected output : JSON returned with 400 status 
    */
    
   it('Check it fails if user provides incorrect password', async (done) => {
    const response = await request(app).post('/api/bookers/login').send({
        email:'test2341242@abc.com',
        password: 'test@abc.com',
    });
    expect(response.statusCode).toEqual(400);
    done();
    });

    /*@test Test Case 7
    Description  : Check it fails if user provides incorrect email format 
    Input : Email:test
            Password: test,
     Expected output : JSON returned with 400 status 
    */
    
    it('Check it fails if user provides incorrect email format', async (done) => {
    const response = await request(app).post('/api/bookers/login').send({
        email:'test',
        password: 'testpassword',
    });
    expect(response.statusCode).toEqual(400);
    done();
    });
    

    /*@test Test Case 8
    Description  : Check it fails if user provides incorrect email and password 
    Input : Email:test
            Password: test,
     Expected output : JSON returned with 400 status 
    */
    
   it('Check it fails if user provides incorrect email format', async (done) => {
    const response = await request(app).post('/api/bookers/login').send({
        email:'test@abc.coooom',
        password: 'testpassword',
    });
    expect(response.statusCode).toEqual(400);
    done();
    });
});
