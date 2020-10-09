//APIs related to a driver, someone who is booked by a booker

const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const Driver= require('../../models/Driver');
const bcrypt = require('bcryptjs');

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
        const {name,email,password,confirmPassword,rate,licenseIssuedDate} = req.body;

        //find whether driver with entered email has already registered
        let driver= await Driver.findOne({email});

         //if the driver already exists in the system then return from here
        if(driver){
            return res.status(400).json({ errors: [{ msg: 'Driver already exists in the system' }] });
        }

        //if this is the new driver then create new driver
        driver=new Driver({name,email,password,confirmPassword,rate,licenseIssuedDate,});

        //generate salt and hash the password of the drvier for protection
        const hashSalt = await bcrypt.genSalt(10);
        driver.password = await bcrypt.hash(password, hashSalt);
        driver.confirmPassword= await bcrypt.hash(confirmPassword,hashSalt);

        //update the database
        await driver.save();

        res.send("Driver Registered");
      }
      catch(err){
        res.status(500).json({ errors: err.message });
      }
    }
}
);

module.exports = router;
