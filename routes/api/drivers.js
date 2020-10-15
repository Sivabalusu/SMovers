//APIs related to a driver, someone who is booked by a booker

const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const Driver= require('../../models/Driver');
const bcrypt = require('bcryptjs');
const config = require('config');
const fn = require('../../libs/functions');

const auth=require('../../middleware/auth');

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

// @route GET api/driver/view/:driver_id
// @desc logout functionality by checking the blacklist jwt
// @access private
router.get('/view/:driver_id', auth, async(req,res) =>{
  try{
    //pass the driver_id as parameter
    const driver = await Driver.findOne(req.params.id).select('-password');
    if(!driver){
      return res.status(400).json({msg:'Driver data not found'});
    }
    res.json(driver);
  }
  catch(err){
    console.error(err.message);
    res.status(500).send('Server Error');
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
// router.delete('/', routeAuth, async(req, res) =>{
//   try{
//     // finds the driver by its email and perform the delete action to delete the driver profile.
//     await Driver.findOneAndRemove({ email: req.driver.email });
//   } catch (err) {
//     //prints the error message if it fails to delete the driver profile.
//     console.error(err.message);
//     res.status(500).send('Server Error');
//   }
// });

module.exports = router;
