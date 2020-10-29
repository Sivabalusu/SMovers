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
    Description  : Check that details are updated when user sends data
    Expected output : JSON returned with 200 status 
  */
  it('Check that details are updated when user sends data', async (done) => {
    const response = await request(app).post('/api/bookers/update').set('x-auth-token',token).send({
      email,
      phone:'4372311345'
    })
    expect(response.statusCode).toEqual(200);
    done();
  });
  /*@test Test Case 2
  Description  : Check that user is unable to change email to an existing one
  Expected output : JSON returned with 400 status 
    */
    it('Check that user is unable to change email to an existing one', async (done) => {
    const response = await request(app).post('/api/bookers/update').set('x-auth-token',token).send({
        email : 'test@abc.com',
    })
    expect(response.statusCode).toEqual(400);
    done();
    });
    
  /*@test Test Case 3
  Description  : Check that user is unable to change when token is not provided
  Expected output : JSON returned with 400 status 
    */
   it('Check that user is unable to change when token is not provided', async (done) => {
    const response = await request(app).post('/api/bookers/update').send({
        email : 'test@abc.com',
    })
    expect(response.statusCode).toEqual(401);
    done();
    });
});
