const app = require('../../server');
const request = require('supertest');

// @desc test plan to test the update details functionality for the booker

describe('Booker Post endpoints', () => {
    token = null;
    const password  =  'testpassword';
    const email = 'testupdatebooker@gmail.com';
    beforeAll(async (done) =>{
        let response = await request(app).post('/api/bookers').send({
            name: 'Test user',
            email,
            password,
            confirmPassword:password,
        });
        if(response.statusCode == 200){
            token = response.body.token;
        }
        done();
    });
    //delete the driver created
    afterAll(async(done)=>{
        await request(app).delete('/api/bookers/').set('x-auth-token',token).set('x-auth-token',token).send({
            password
        });
        done();
    });
    /*@test Test Case 1
    Description  : Check that new  password does not matches new password
    Expected output : JSON returned with 400 status 
  */
  it('Check that new  password does not matches new password', async (done) => {
    const response = await request(app).post('/api/bookers/updatePassword').set('x-auth-token',token).send({
      currentPassword:password,
      password,
      confirmPassword:"tarun8586"
    })
    expect(response.statusCode).toEqual(400);
    done();
  });
    /*@test Test Case 2
    Description  : Should not update password when new password and confirmPassword do not match
    Expected output : JSON returned with 400 status 
  */
  it('Should not update password when new password and confirmPassword do not match', async (done) => {
    const response = await request(app).post('/api/bookers/updatePassword').set('x-auth-token',token).send({
      currentPassword:password,
      password:"tarun8484",
      confirmPassword:"tarun8586"
    })
    expect(response.statusCode).toEqual(400);
    done();
  });
  
    /*@test Test Case 3
    Description  : Should not update password when password's length is less than 8 chars
    Expected output : JSON returned with 400 status 
  */
    it('Should not update password when password\'s length is less than 8 chars', async (done) => {
      const response = await request(app).post('/api/bookers/updatePassword').set('x-auth-token',token).send({
        currentPassword:password,
        password:"tarun",
        confirmPassword:"tarun"
      })
      expect(response.statusCode).toEqual(400);
      done();
    });
    
  
    /*@test Test Case 4
    Description  : Should update password when correct data is parsed
    Expected output : JSON returned with 200 status 
  */
  it('Should update password when correct data is parsed', async (done) => {
    const response = await request(app).post('/api/bookers/updatePassword').set('x-auth-token',token).send({
      currentPassword:password,
      password:"tarun8586",
      confirmPassword:"tarun8586"
    })
    expect(response.statusCode).toEqual(200);
    done();
  });
  
  /*@test Test Case 5
  Description  : Should not update password when no token is provided
    Expected output : JSON returned with 401 status 
  */
  it('Should not update password when no token is provided', async (done) => {
    const response = await request(app).post('/api/bookers/updatePassword').send({
      currentPassword:password,
      password:"tarun",
      confirmPassword:"tarun"
    })
    expect(response.statusCode).toEqual(401);
    done();
  });
});
