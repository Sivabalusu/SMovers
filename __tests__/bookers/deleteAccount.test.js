const app = require('../../server');
const request = require('supertest');

// @desc test plan to test the delete account for booker

describe('Booker Delete tests', () => {
  token = null;
  const password = "test@abc.com";
  const email = "testingBookerJest@abc.com";
 
  beforeAll(async (done) =>{
    let response = await request(app).post('/api/bookers').send({
        name: 'Test user',
        email,
        password,
        confirmPassword:password,
      });
    if(response.statusCode == 200){
        token = response.body.token;
        done();
    }
  });
  /*@test Test Case 1
    Description  : Account cannot be deleted because no token is provided
    Expected output : JSON returned with 401 status 
  */
  it('Account cannot be deleted because no token is provided', async (done) => {
    const response = await request(app).delete('/api/bookers/');
    expect(response.statusCode).toEqual(401);
    done();
  });

  /*@test Test Case 2
    Description  : Account cannot be deleted when no password is provided
    Expected output : JSON returned with 500 status 
  */
  it('Account cannot be deleted when no password is provided', async (done) => {
    const response = await request(app).delete('/api/bookers/').set('x-auth-token',token).send({});
    expect(response.statusCode).toEqual(500);
    done();
  });

  /*@test Test Case 3
    Description  : Account cannot be deleted when wrong password is provided
    Expected output : JSON returned with 401 status 
  */
  it('Account cannot be deleted when wrong password is provided', async (done) => {
    const response = await request(app).delete('/api/bookers/').set('x-auth-token',token).send({
        password:`${password}abc`
    });
    expect(response.statusCode).toEqual(401);
    done();
  });


  /*@test Test Case 4
    Description  : Account should be deleted when correct password and token are provided
    Expected output : JSON returned with 400 status 
  */
 it('Account cannot be deleted when wrong password is provided', async (done) => {
    const response = await request(app).delete('/api/bookers/').set('x-auth-token',token).send({
        password
    });
    expect(response.statusCode).toEqual(200);
    done();
  });

});
