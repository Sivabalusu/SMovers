//APIs related to a driver, someone who is booked by a booker

const express = require('express');
const routeAuth = require('../../middleware/auth');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const Driver= require('../../models/Driver');
const bcrypt = require('bcryptjs');
const config = require('config');
const fn = require('../../libs/functions');

// @route  POST api/drivers
// @desc   Register router
// @access Public
router.post(
    '/',
     [ //validate the request parameters sent by the client
        check('name', 'Name is required').not().isEmpty(), //check if name is empty
        check('email', 'Enter a valid email').isEmail(), //use validator to validate an email
        check('password', 'Password length should be at least 8').isLength({
          //password should be matched according to the criteria defind in the line above
          min: 8,
        }),
        check('confirmPassword',"Both passowrds must match").custom((value,{req})=>{
          return value===req.body.password;
        }),
        check('rate','Rate (cost/km) is required').not().isEmpty(),
        check('licenseIssuedDate','License issued date is mandatory').not().isEmpty(),

    ], 
    async(req, res) => {
    //when request is received, validate the driver data before proceeding further
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      //if there were some errors in the data received send the 400 response with the error message
      return res.status(400).json({ errors: errors.array() });
    } else {
      //if data is correct, add the driver
      try {
        //destructure the parameters
        const {name,password,rate,licenseIssuedDate} = req.body;
        let {email} = req.body;
        email = email.toLowerCase();
        //find whether driver with entered email has already registered
        let driver= await Driver.findOne({email});

         //if the driver already exists in the system then return from here
        if(driver){
            return res.status(400).json({ errors: [{ msg: 'Driver already exists in the system' }] });
        }
        //if this is the new driver then create new driver
        driver=new Driver({name,email,password,rate,licenseIssuedDate,});

        //generate salt and hash the password of the drvier for protection
        const hashSalt = await bcrypt.genSalt(10);
        driver.password = await bcrypt.hash(password, hashSalt);

        //update the database
        await driver.save();
        //creating jwt token
        const payload = {
            user: {
              /*this id is not in the model, however MongoDB generates object id with every record
              and mongoose provide an interface to use _id as id without using underscore*/
              id: driver.id,
            },
          };
          //get jwt, json web token
          fn.createJwtToken(payload, res);
      }
      catch(err){
        res.status(500).json({ errors: err.message });
      }
    }
}
);

// @route Post api/driver/login
// @desc authenticate user to login
// @access Public
router.post(
    '/login',
    [
      //check if the driver provided the values
      check('email', 'Email is required').isEmail(),
      check('password', 'Password is required').exists(),
    ],
    async (req, res) => {
      //when request is received, validate the driver data before proceeding further
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        //if there were some errors in the data received send the 400 response with the error message
        return res.status(400).json({ errors: errors.array() });
      } else {
        //if data is correct, then log driver
        try {
          //destructure the parameters
          const { password } = req.body;
          let {email} = req.body;
          email = email.toLowerCase();
          //find the driver with the email entered
          let driver = await Driver.findOne({ email });
  
          //if the driver already exists in the system then return from here
          if (!driver) {
            return res.status(400).json({ errors: [{ msg: 'Invalid Credentials' }] });
          }
          // check if the password entered password is correct or not by using bcrypt
          const valid = await bcrypt.compare(password, driver.password);
  
          if (!valid) {
            return res.status(400).json({ errors: [{ msg: 'Invalid Credentials' }] });
          }
  
          //create a payload to be used by jwt to create hash
          const payload = {
            user: {
              /*this id is not in the model, however MongoDB generates object id with every record
              and mongoose provide an interface to use _id as id without using underscore*/
              id: driver.id,
            },
          };
          //get jwt, json web token
          fn.createJwtToken(payload, res);
        } catch (err) {
          res.status(500).json({ errors: err.message });
        }
      }
    }
);

// @route POST api/drivers/update
// @desc View driver profile functionality by using jwt login token
// @access public
router.post('/update', routeAuth, async(req,res) =>{
  try{
   //get the user containing the id from the request which we got after routeAuth was run
   let driver = req.user;
    //read the updates from request body
    const updates=req.body;
    driver = await Driver.findById(driver.id);
    //in mongoose, the updated values won't appear immediately current post request
    //to get new updated values to post request we need to set options to true
    const options= {new:true};
    update = await Driver.findByIdAndUpdate(driver.id,updates,options);
    if(!update){
      //If there is no driver data
      return res.status(400).json({msg:'Update failed'});
    }
    //send driver data as response
    res.json(update);
  }
  catch(err){
    console.error(err.message);
    if(err.kind=='ObjectId'){
      return res.status(400).json({msg:'Update failed'});
    }
    res.status(500).send('Server Error');
  }
});

// @route POST api/drivers/updatePassword
// @desc View driver profile functionality by using jwt login token
// @access public
router.post('/updatePassword', routeAuth,[
  //validate the request parameters sent by the client
  check('oldPassword','Current password required!').not().isEmpty(),
  check('newPassword', 'Password should have at least 8 chars!').custom((value)=>{
    return !(typeof value == typeof undefined || value == null || value.length < 8);
  }),
  check('confirmPassword','Passwords do not match!').custom((value,{req})=>{
    return value == req.body.newPassword;
  }),
  check('oldPassword','Current and new passwords cannot be same!').custom((value,{req})=>{
    return !(value == req.body.newPassword)
  })
], async(req,res) =>{
    //when request is received, validate the user data before proceeding further
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      //if there were some errors in the data received send the 400 response with the error message
      return res.status(400).json({ errors: errors.array() });
    }else{
    try{
    //get the user containing the id from the request which we got after routeAuth was run
    let driver = req.user;
      //read the updates from request body
      const {oldPassword, newPassword}=req.body;
      if(oldPassword===newPassword)
      {
        return res.status(401).json({errors:[{msg:"New Password must not equal to old password"}]});
      }
      driver = await Driver.findById(driver.id);
      console.log(driver.id);
      if(driver){
        // check if the password and entered password is correct or not by using bcrypt
        const valid = await bcrypt.compare(oldPassword, driver.password);
        if(valid){
          const hashSalt = await bcrypt.genSalt(10);
          const password = await bcrypt.hash(newPassword, hashSalt);
          //update the password and save it to database
        driver.password=password;
        driver.save();
          //return the updated user for demonstrating purposes
          return res.status(200).json(driver);
        }
        //when user enters wrong password while deleting the account
        return res.status(401).json({errors:[{msg:"Incorrect Password!"}]})
      }
      return res.status(400).json({errors:[{msg:"Cannot find the driver!"}]})
    
    }
    catch(err){
      console.error(err.message);
      if(err.kind=='ObjectId'){
        return res.status(400).json({msg:'Update failed'});
      }
      res.status(500).send('Server Error');
    }
  }  
});

// @route GET api/driver/logout
// @desc logout functionality by checking the blacklist jwt
// @access Public
router.get('/logout', async (req, res) => {
  try {
    //call method to invalidate the jwt token by blacklisting it using DB
    fn.logout(req, res);
  } catch (err) {
    //something happened at the server side
    res.status(500).json({ errors: [{ msg: err.message }] });
  }
});

// @route Delete api/driver
// @desc delete functionality to delete the driver profile.
// @access Public
router.delete('/', routeAuth, async(req, res) =>{
  try{
    //get the user containing the id from the request which we got after routeAuth was run
    let driver = req.user;
    const {password} = req.body;
    //get the user data from the database so that we can check whether the password user entered is right or not
    driver = await Driver.findById(driver.id);
    if(driver){
      // check if the password entered password is correct or not by using bcrypt
      const valid = await bcrypt.compare(password, driver.password);
      if(valid){
        driver = await Driver.findByIdAndDelete(driver.id);
        //return the deleted user for demonstrating purposes
        return res.status(200).json(driver);
      }
      //when user enters wrong password while deleting the account
      return res.status(400).json({errors:[{msg:"Incorrect Password!"}]})
      return res.status(401).json({errors:[{msg:"Incorrect Password!"}]})
    }
    return res.status(400).json({errors:[{msg:"Cannot find the driver!"}]})
  } catch (err) {
    //prints the error message if it fails to delete the driver profile.
    console.error(err.message);
    res.status(500).json({errors: [{msg: err.message}] });
  }
});

module.exports = router;
