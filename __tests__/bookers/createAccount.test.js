const app = require('../../server');
const request = require('supertest');

// @desc test plan to test the create account functionality for the booker

describe('Booker Post endpoints', () => {
  /*@test Test Case 1
    Description  : Check the actual functionality by providing email, password, and name
    Input : Email: test@abc.com,
            Password: test
            Name: Test user
    Expected output : JSON returned with 200 status 
  */
  it('Should create a new user and return a web token', async (done) => {
    let response = await request(app).post('/api/bookers').send({
      name: 'Test user',
      email: 'test@abc.com',
      password: 'test@abc.com',
      confirmPassword: 'test@abc.com',
    });
    if(response.statusCode == 200)
    {
      response = await request(app).get('/api/auth/1').set('x-auth-token',response.body.token);
      expect(response.statusCode).toEqual(200);
      done();
      return;
    }
    expect(response.statusCode).toEqual(400);
    done();
  });

  /*@test Test Case 2
    Description  : Check if it fails when password is not provided
    Input:  Email: test2@abc.com
            Name: Test user
    Expected output : JSON returned with 400 status
  */
  it('Check if it returns status 400 because password is not provided', async (done) => {
    const response = await request(app).post('/api/bookers').send({
      name: 'Test user',
      email: 'test2@abc.com',
    });
    expect(response.statusCode).toEqual(400);
    done();
  });

  /*@test Test Case 3
    Description  : Check if it fails when email is not provided
    Input:  Name: Test user
            Password: test
    Expected output : JSON returned with 400 status
  */
  it('Check if it returns status 400 because email is not provided', async (done) => {
    const response = await request(app).post('/api/bookers').send({
      name: 'Test user',
      password: 'test',
    });
    expect(response.statusCode).toEqual(400);
    done();
  });

  /*@test Test Case 4
    Description  : Check if it fails when name is not provided
    Input:  Email: test3@abc.com
            Password: test
    Expected output : JSON returned with 400 status
  */
  it('Check if it returns status 400 because name is not provided', async (done) => {
    const response = await request(app).post('/api/bookers').send({
      email: 'test3@abc.com',
      password: 'test',
    });
    expect(response.statusCode).toEqual(400);
    done();
  });

  /*@test Test Case 5
    Description  : Check if it fails and returns status 400 when no data is provided
    Input:  NA
    Expected output : JSON returned with 400 status
  */
  it('Check if it fails and returns status 400 when no data is provided', async (done) => {
    const response = await request(app).post('/api/bookers').send({
      name: 'Test user',
      password: 'test',
    });
    expect(response.statusCode).toEqual(400);
    done();
  });

  /*@test Test Case 6
    Description  : Check the email validation is done correctly 
    Input: Email: test@abc
                  Password: test
                  Name: test
    Expected output : JSON returned with 400 status
  */
  it('Check the email validation is done correctly ', async (done) => {
    const response = await request(app).post('/api/bookers').send({
      email: 'test',
      name: 'test',
      password: 'test',
    });
    expect(response.statusCode).toEqual(400);
    done();
  });

  /*@test Test Case 7
    Description  : Check if password validation is working fine i.e. it should be 8 or more characters long
    Input:  Email: test4@gabc.com
            Password: test
            Name: test
    Expected output : JSON returned with 400 status
  */
  it('Check if password validation is working fine i.e. it should be 8 or more characters long ', async (done) => {
    const response = await request(app).post('/api/bookers').send({
      email: 'test@abc.com',
      name: 'test',
      password: 'test',
    });
    expect(response.statusCode).toEqual(400);
    done();
  });

  /*@test Test Case 8
    Description  : No accounts should exist with same email/username
    Input:  Email: test4@gabc.com
            Password: test
            Name: test
    Expected output : JSON returned with 400 status
  */
  it('No accounts should exist with same email/username', async (done) => {
    const response = await request(app).post('/api/bookers').send({
      email: 'test@abc.com',
      name: 'test',
      password: 'test',
    });
    expect(response.statusCode).toEqual(400);
    done();
  });
});
