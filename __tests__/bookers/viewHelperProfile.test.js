const app = require('../../server');
const request = require('supertest');

// @desc test suite to test the view Helper profile to booker functionality

describe('Booker - View Helper endpoint', () => { 
    token = null;
    id = null;
    const password  =  'testpassword';
    const email = 'testviewhelper@gmail.com';
    beforeAll(async (done) =>{
        let response = await request(app).post('/api/helpers').send({
          name: 'Test Helper',
          email,
          password,
          confirmPassword:password,
          rate:5,
          location:'City'
        });
        if(response.statusCode == 200){
            token = response.body.token;
            response = await request(app).get('/api/auth/3').set('x-auth-token',token);
            if(response.statusCode == 200)
                id = response.body._id;
        }
        done();
    });
    //delete the helper created
    afterAll(async(done)=>{
        await request(app).delete('/api/helpers/').set('x-auth-token',token).send({
            password
        });
        done();
    });
    /*@test Test Case 1
    Description  : Failure to get the data because invalid id is sent 
    Expected output : JSON returned with 500 status 
    */
   it('Failure to get the data because invalid id is sent ', async (done) => {
    const response = await request(app).get(`/api/bookers/helper/${id}123123`);
    expect(response.statusCode).toEqual(500);
    done();
  });
  
    /*@test Test Case 2
    Description  : Failure to get the data because invalid id is sent 
    Expected output : JSON returned with 400 status 
    */
   it('Failure to get the data because invalid id is sent ', async (done) => {
    const response = await request(app).get('/api/bookers/helper/5f8d18196b3bae0a80c95c61');
    expect(response.statusCode).toEqual(400);
    done();
  });
  
    /*@test Test Case 3
    Description  : Endpoint is not found when id is not provided
    Expected output : JSON returned with 404 status 
    */
   it('Endpoint is not found when id is not provided', async (done) => {
    const response = await request(app).get('/api/bookers/helper/');
    expect(response.statusCode).toEqual(404);
    done();
  });
  
    /*@test Test Case 4
    Description  : Helper's data is returned as json when correct id is provided
    Expected output : JSON returned with 200 status 
    */
    it('Helper\'s data is returned as json when correct id is provided ', async (done) => {
    console.log(id);
    const response = await request(app).get(`/api/bookers/helper/${id}`);
    expect(response.statusCode).toEqual(200);
    done();
    });
});