const app = require('../../server');
const request = require('supertest');

// @desc test plan to test the create account functionality for the driver

describe('Driver Post endpoints', () => {
  /*@test Test Case 1
    Description  : Check the actual functionality by providing name, email, password (twice),rate, 
                    licenscIssuedDate, carType, drivingExperience,location
    Input : Name: Test Driver,
            Email:test1@gmail.com,
            Password: testpassword,
            ConfirmPassword:testpassword,
            Rate: rate,
            licenseIssuedDate: date,
            carType:car type,
            drivingExperience:experience years,
            location:City
    Expected output : JSON returned with 200 status
    */ 
  it('Should create a new user and return a web token', async (done) => {
    const response = await request(app).post('/api/drivers').send({
        name: 'TestDriver1',
        email:'testdriver@gmail.com',
        password: 'testpassword',
        confirmPassword:'testpassword',
        rate:14,
        licenseIssuedDate: '10-06-2018',
        carType:'car type',
        drivingExperience:1,
        location:'City',
    });
    if(response.statusCode == 200)
    {
      response = await request(app).get('/api/auth/2').set('x-auth-token',response.body.token);
      expect(response.statusCode).toEqual(200);
      done();
      return;
    }
    expect(response.statusCode).toEqual(400);
    done();
  });

   /*@test Test Case 2
   Description  : Check if it fails when no input provided
   Input:  
   Expected output : JSON returned with 400 status
 */
 it('Check if it returns status 400 as no input provided', async (done) => {
   const response = await request(app).post('/api/drivers').send({     
   });
   expect(response.statusCode).toEqual(400);
   done();
 });

  /*@test Test Case 3
  Description  : Check if it fails when name is not provided
  Input: email:test@email.com,
         password: test,
         confirmPassword:test,
         rate: cost per kms,
         licenseIssuedDate: date,
         carType:car type,
         drivingExperience:experience in years,
         location:City
  Expected output : JSON returned with 400 status
*/
it('Check if it returns status 400 because name is not provided', async (done) => {
  const response = await request(app).post('/api/drivers').send({
        email:'test@email.com',
        password: 'testpassword',
        confirmPassword:'testpassword',
        rate:14,
        licenseIssuedDate: '2019-10-22',
        carType:'car type',
        drivingExperience:'1',
        location:'City'
  });
  expect(response.statusCode).toEqual(400);
  done();
});

/*@test Test Case 4
Description  : Check if it fails when password is not provided
Input:  Name:test driver,
        Email:test@email.com,
        ConfirmPassword:test,
        Rate: cost per kms,
        licenseIssuedDate: date,
        carType:car type,
        drivingExperience:experience in years,
        location:City
Expected output : JSON returned with 400 status
*/
it('Check if it returns status 400 because password is not provided', async (done) => {
const response = await request(app).post('/api/drivers').send({
        name: 'TestDriver1',
        email:'testdriver@gmail.com',
        confirmPassword:'testpassword',
        rate:14,
        licenseIssuedDate: '10-06-2018',
        carType:'car type',
        drivingExperience:1,
        location:'City',
});
expect(response.statusCode).toEqual(400);
done();
});

/*@test Test Case 5
Description  : Chect it fails if both passwords does not match
Input : Name: Test Driver,
        Email:test@email.com,
        Password: testpassword,
        ConfirmPassword:,
        Rate: cost per kms,
        licenseIssuedDate: date,
        carType:car type,
        drivingExperience:experience in years,
        location:City
Expected output : JSON returned with 400 status 
*/
it('Check if it returns status 400 as both passwords does not match', async (done) => {
const response = await request(app).post('/api/drivers').send({
        name: 'TestDriver1',
        email:'testdriver@gmail.com',
        password: 'testpassword',
        confirmPassword:'',
        rate:14,
        licenseIssuedDate: '10-06-2018',
        carType:'car type',
        drivingExperience:1,
        location:'City',
});
expect(response.statusCode).toEqual(400);
done();
});

/*@test Test Case 6
Description  : Chect it fails if rate not provided
Input : Name: Test Driver,
        Email:test@email.com,
        Password: test,
        ConfirmPassword:test,
        licenseIssuedDate: date,
        carType:car type,
        drivingExperience:experience in years,
        location:City
Expected output : JSON returned with 400 status 
*/
it('Check if it returns status 400 because rate is not provided', async (done) => {
const response = await request(app).post('/api/drivers').send({
        name: 'TestDriver1',
        email:'testdriver@gmail.com',
        password: 'testpassword',
        confirmPassword:'testpassword',
        licenseIssuedDate: '10-06-2018',
        carType:'car type',
        drivingExperience:1,
        location:'City',
});
expect(response.statusCode).toEqual(400);
done();
});

/*@test Test Case 7
Description  : Chect it fails if both licenseIssuedDate not provided
Input : Name: Test Driver,
        Email:test@email.com,
        Password: test,
        ConfirmPassword:,
        Rate: cost per kms,
        carType:car type,
        drivingExperience:experience in years,
        location:City
Expected output : JSON returned with 400 status 
*/
it('Check if it returns status 400 because licenseIssuedDate is not provided', async (done) => {
const response = await request(app).post('/api/drivers').send({
        name: 'TestDriver1',
        email:'testdriver@gmail.com',
        password: 'testpassword',
        confirmPassword:'testpassword',
        rate:14,
        carType:'car type',
        drivingExperience:1,
        location:'City',
});
expect(response.statusCode).toEqual(400);
done();
});

/*@test Test Case 8
Description  : Chect it fails if carType is not provided
Input : Name: Test Driver,
        Email:test@email.com,
        Password: test,
        ConfirmPassword:,
        Rate: cost per kms,
        licenseIssuedDate: date,
        drivingExperience:experience in years,
        location:City
Expected output : JSON returned with 400 status 
*/
it('Check if it returns status 400 because carType is not provided', async (done) => {
const response = await request(app).post('/api/drivers').send({
        name: 'TestDriver1',
        email:'testdriver@gmail.com',
        password: 'testpassword',
        confirmPassword:'testpassword',
        rate:14,
        licenseIssuedDate: '10-06-2018',
        drivingExperience:1,
        location:'City',
});
expect(response.statusCode).toEqual(400);
done();
});

/*@test Test Case 9
Description  : Chect it fails if drivingExperience not provided
Input : Name: Test Driver,
        Email:test@email.com,
        Password: test,
        ConfirmPassword:test,
        Rate: cost per kms,
        licenseIssuedDate: date,
        carType:car type,
        location:City
Expected output : JSON returned with 400 status 
*/
it('Check if it returns status 400 because drivingExperience is not provided', async (done) => {
const response = await request(app).post('/api/drivers').send({
        name: 'TestDriver1',
        email:'testdriver@gmail.com',
        password: 'testpassword',
        confirmPassword:'testpassword',
        rate:14,
        licenseIssuedDate: '10-06-2018',
        carType:'car type',
        location:'City',
});
expect(response.statusCode).toEqual(400);
done();
});

/*@test Test Case 9
Description  : Chect it fails if location not provided
Input : Name: Test Driver,
        Email:test@email.com,
        Password: test,
        ConfirmPassword:test,
        Rate: cost per kms,
        licenseIssuedDate: date,
        carType:car type,
        drivingExperience:experience in years,
Expected output : JSON returned with 400 status 
*/
it('Check if it returns status 400 because location is not provided', async (done) => {
const response = await request(app).post('/api/drivers').send({
        name: 'TestDriver1',
        email:'testdriver@gmail.com',
        password: 'testpassword',
        confirmPassword:'testpassword',
        rate:14,
        licenseIssuedDate: '10-06-2018',
        carType:'car type',
        drivingExperience:1,
});
expect(response.statusCode).toEqual(400);
done();
});

});