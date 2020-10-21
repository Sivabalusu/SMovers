const app = require('../../server');
const request = require('supertest');

// @desc test plan to test the create account functionality for the driver

describe('Driver Post endpoints', () => {
  /*@test Test Case 1
    Description  : Check the actual functionality by providing name, email, password (twice),rate, 
                    licenscIssuedDate, carType, drivingExperience
    Input : Name: Test Driver,
            Email:test@email.com,
            Password: test,
            ConfirmPassword:test,
            Rate: cost per kms,
            licenseIssuedDate: date,
            carType:car type,
            drivingExperience:experience in years,
            location:city name
    Expected output : JSON returned with 200 status 
  */
  it('Should create a new user and return a web token', async (done) => {
    const response = await request(app).post('/api/drivers').send({
        Name: 'Test Driver',
        Email:'test@email.com',
        Password: 'test',
        ConfirmPassword:'test',
        Rate:'cost per kms',
        licenseIssuedDate: 'date',
        carType:'car type',
        drivingExperience:'1',
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
   const response = await request(app).post('/api/drivers').send({
     
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
         licenseIssuedDate: date,
         carType:car type,
         drivingExperience:experience in years,
         location:city name
  Expected output : JSON returned with 400 status
*/
it('Check if it returns status 400 because name is not provided', async (done) => {
  const response = await request(app).post('/api/drivers').send({
        Email:'test@email.com',
        Password: 'test',
        ConfirmPassword:'test',
        Rate:'cost per kms',
        licenseIssuedDate: 'date',
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
        location:city name
Expected output : JSON returned with 400 status
*/
it('Check if it returns status 400 because password is not provided', async (done) => {
const response = await request(app).post('/api/drivers').send({
      Name:'test driver',
      Email:'test@email.com',
      ConfirmPassword:'test',
      Rate:'cost per kms',
      licenseIssuedDate: 'date',
      carType:'car type',
      drivingExperience:'1',
      location:'City'
});
expect(response.statusCode).toEqual(400);
done();
});

/*@test Test Case 5
Description  : Chect it fails if both passwords does not match
Input : Name: Test Driver,
        Email:test@email.com,
        Password: test,
        ConfirmPassword:,
        Rate: cost per kms,
        licenseIssuedDate: date,
        carType:car type,
        drivingExperience:experience in years,
        location:city name
Expected output : JSON returned with 400 status 
*/
it('Check if it returns status 400 as both passwords does not match', async (done) => {
const response = await request(app).post('/api/drivers').send({
        Name: 'Test Driver',
        Email:'test@email.com',
        Password: 'test',
        ConfirmPassword:'',
        Rate:'cost per kms',
        licenseIssuedDate: 'date',
        carType:'car type',
        drivingExperience:'1',
        location:'City'
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
        location:city name
Expected output : JSON returned with 400 status 
*/
it('Check if it returns status 400 because rate is not provided', async (done) => {
const response = await request(app).post('/api/drivers').send({
        Name: 'Test Driver',
        Email:'test@email.com',
        Password: 'test',
        ConfirmPassword:'test',
        licenseIssuedDate: 'date',
        carType:'car type',
        drivingExperience:'1',
        location:'City'
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
        location:city name
Expected output : JSON returned with 400 status 
*/
it('Check if it returns status 400 because licenseUssuedDate is not provided', async (done) => {
const response = await request(app).post('/api/drivers').send({
        Name: 'Test Driver',
        Email:'test@email.com',
        Password: 'test',
        ConfirmPassword:'',
        Rate:'cost per kms',
        carType:'car type',
        drivingExperience:'1',
        location:'City'
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
        location:city name,
Expected output : JSON returned with 400 status 
*/
it('Check if it returns status 400 because carType is not provided', async (done) => {
const response = await request(app).post('/api/drivers').send({
        Name: 'Test Driver',
        Email:'test@email.com',
        Password: 'test',
        ConfirmPassword:'',
        Rate:'cost per kms',
        licenseIssuedDate: 'date',
        drivingExperience:'1',
        location:'City'
});
expect(response.statusCode).toEqual(400);
done();
});

/*@test Test Case 9
Description  : Chect it fails if drivingExperience not provided
Input : Name: Test Driver,
        Email:test@email.com,
        Password: test,
        ConfirmPassword:,
        Rate: cost per kms,
        licenseIssuedDate: date,
        carType:car type,
        location:city name
Expected output : JSON returned with 400 status 
*/
it('Check if it returns status 400 because drivingExperience is not provided', async (done) => {
const response = await request(app).post('/api/drivers').send({
        Name: 'Test Driver',
        Email:'test@email.com',
        Password: 'test',
        ConfirmPassword:'',
        Rate:'cost per kms',
        licenseIssuedDate: 'date',
        carType:'car type',
        location:'City'
});
expect(response.statusCode).toEqual(400);
done();
});

/*@test Test Case 9
Description  : Chect it fails if location not provided
Input : Name: Test Driver,
        Email:test@email.com,
        Password: test,
        ConfirmPassword:,
        Rate: cost per kms,
        licenseIssuedDate: date,
        carType:car type,
        drivingExperience:experience in years,
Expected output : JSON returned with 400 status 
*/
it('Check if it returns status 400 because location is not provided', async (done) => {
const response = await request(app).post('/api/drivers').send({
        Name: 'Test Driver',
        Email:'test@email.com',
        Password: 'test',
        ConfirmPassword:'',
        Rate:'cost per kms',
        licenseIssuedDate: 'date',
        carType:'car type',
        drivingExperience:experience in years,
});
expect(response.statusCode).toEqual(400);
done();
});

});