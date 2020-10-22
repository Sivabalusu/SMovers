const app = require('../../server');
const request = require('supertest');

// @desc test plan to test the create account functionality for the helper

describe('Helper Post endpoints', () => {
  /*@test Test Case 1
    Description  : Check the actual functionality by providing name, email, password (twice),rate,location
                    l
    Input : Name: Test Helper,
            Email:test@email.com,
            Password: test,
            ConfirmPassword:test,
            Rate: cost per kms,
            location:city name
    Expected output : JSON returned with 200 status 
  */
  it('Should create a new user and return a web token', async (done) => {
    const response = await request(app).post('/api/helpers').send({
        Name: 'Test Helper',
        Email:'test@email.com',
        Password: 'test',
        ConfirmPassword:'test',
        Rate:5,
        location:'City'
    });
    expect(response.statusCode).toEqual(200);
    done();
  });

   /*@test Test Case 2
   Description  : Check if it fails when no input provided
   Input:  
   Expected output : JSON returned with 400 status
 */
 it('Check if it returns status 400 as no input provided', async (done) => {
   const response = await request(app).post('/api/helpers').send({
     
   });
   expect(response.statusCode).toEqual(400);
   done();
 });

  /*@test Test Case 3
  Description  : Check if it fails when name is not provided
  Input: Email:test@email.com,
         Password: test,
         ConfirmPassword:test,
         Rate: cost per kms,
         location:city name
  Expected output : JSON returned with 400 status
*/
it('Check if it returns status 400 because name is not provided', async (done) => {
  const response = await request(app).post('/api/helpers').send({
        Email:'test@email.com',
        Password: 'test',
        ConfirmPassword:'test',
        Rate:5,
        location:'City'
  });
  expect(response.statusCode).toEqual(400);
  done();
});

/*@test Test Case 4
Description  : Check if it fails when password is not provided
Input:  Name:test Helper,
        Email:test@email.com,
        ConfirmPassword:test,
        Rate: cost per kms,
        location:city name
Expected output : JSON returned with 400 status
*/
it('Check if it returns status 400 because password is not provided', async (done) => {
const response = await request(app).post('/api/helpers').send({
      Name:'test Helper',
      Email:'test@email.com',
      ConfirmPassword:'test',
      Rate:5,
      location:'City'
});
expect(response.statusCode).toEqual(400);
done();
});

/*@test Test Case 5
Description  : Chect it fails if both passwords does not match
Input : Name: Test Helper,
        Email:test@email.com,
        Password: test,
        ConfirmPassword:,
        Rate: cost per kms,
        location:city name
Expected output : JSON returned with 400 status 
*/
it('Check if it returns status 400 as both passwords does not match', async (done) => {
const response = await request(app).post('/api/helpers').send({
        Name: 'Test Helper',
        Email:'test@email.com',
        Password: 'test',
        ConfirmPassword:'',
        Rate:4,
        location:'City'
});
expect(response.statusCode).toEqual(400);
done();
});

/*@test Test Case 6
Description  : Chect it fails if rate not provided
Input : Name: Test Helper,
        Email:test@email.com,
        Password: test,
        ConfirmPassword:test,
        location:city name
Expected output : JSON returned with 400 status 
*/
it('Check if it returns status 400 because rate is not provided', async (done) => {
const response = await request(app).post('/api/helpers').send({
        Name: 'Test Helper',
        Email:'test@email.com',
        Password: 'test',
        ConfirmPassword:'test',
        location:'City'
});
expect(response.statusCode).toEqual(400);
done();
});

/*@test Test Case 7
Description  : Chect it fails if location not provided
Input : Name: Test Helper,
        Email:test@email.com,
        Password: test,
        ConfirmPassword:,
        Rate: cost per kms,
Expected output : JSON returned with 400 status 
*/
it('Should create a new user and return a web token', async (done) => {
const response = await request(app).post('/api/helpers').send({
        Name: 'Test Helper',
        Email:'test@email.com',
        Password: 'test',
        ConfirmPassword:'',
        Rate:5,
});
expect(response.statusCode).toEqual(400);
done();
});

});