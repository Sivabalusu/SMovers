const app = require('../../server');
const request = require('supertest');

// @desc test plan to test the View driver profile to booker functionality

describe('Booker - View Driver endpoint', () => { 
    token = null;
    id = null;
    const password  =  'testpassword';
    const email = 'testviewdriver@gmail.com';
    beforeAll(async (done) =>{
        let response = await request(app).post('/api/drivers').send({
            name: 'TestDriver1',
            email,
            password,
            confirmPassword:password,
            rate:14,
            licenseIssuedDate: '10-06-2018',
            carType:'car type',
            drivingExperience:1,
            location:'City',
        });
        if(response.statusCode == 200){
            token = response.body.token;
            response = await request(app).get('/api/auth/2').set('x-auth-token',token);
            if(response.statusCode == 200)
                id = response.body._id;
        }
        done();
    });
    //delete the driver created
    afterAll(async(done)=>{
        await request(app).delete('/api/drivers/').set('x-auth-token',token).send({
            password
        });
        done();
    });
    /*@test Test Case 1
    Description  : Failure to get the data because invalid id is sent 
    Expected output : JSON returned with 500 status 
    */
   it('Failure to get the data because invalid id is sent ', async (done) => {
    const response = await request(app).get(`/api/bookers/driver/${id}123123`);
    expect(response.statusCode).toEqual(500);
    done();
  });
  
    /*@test Test Case 2
    Description  : Failure to get the data because invalid id is sent 
    Expected output : JSON returned with 400 status 
    */
   it('Failure to get the data because invalid id is sent ', async (done) => {
    const response = await request(app).get('/api/bookers/driver/5f8d18196b3bae0a80c95c61');
    expect(response.statusCode).toEqual(400);
    done();
  });
  
    /*@test Test Case 3
    Description  : Endpoint is not found when id is not provided
    Expected output : JSON returned with 400 status 
    */
   it('Endpoint is not found when id is not provided', async (done) => {
    const response = await request(app).get('/api/bookers/driver/');
    expect(response.statusCode).toEqual(404);
    done();
  });
  
    /*@test Test Case 4
    Description  : Driver's data is returned as json when correct id is provided
    Expected output : JSON returned with 200 status 
    */
    it('Driver\'s data is returned as json when correct id is provided ', async (done) => {
    const response = await request(app).get(`/api/bookers/driver/${id}`);
    expect(response.statusCode).toEqual(200);
    done();
    });
});