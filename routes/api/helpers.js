//APIs related to a helper, someone who is booked as a helper by a booker

const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const Helper = require('../../models/Helper');
const config = require('config');
const fn = require('../../libs/functions');

// @route GET api/helpers
// @desc Test router
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
        check('rate','Rate (pay/hr) is required').not().isEmpty(),

    ], 
    async(req, res) => {
    //when request is received, validate the helper data before proceeding further
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      //if there were some errors in the data received send the 400 response with the error message
      return res.status(400).json({ errors: errors.array() });
    } else {
      //if data is correct, add the helper
      try {
        //destructure the parameters
        const {name,password,rate} = req.body;
        let {email} = req.body;
        email = email.toLowerCase();
        //find whether helper with entered email has already registered
        let helper= await Helper.findOne({email});

         //if the helper already exists in the system then return from here
        if(helper){
            return res.status(400).json({ errors: [{ msg: 'Helper already exists in the system' }] });
        }

        //if this is the new helper then create new helper
        helper=new Helper({name,email,password,rate});

        //generate salt and hash the password of the drvier for protection
        const hashSalt = await bcrypt.genSalt(10);
        helper.password = await bcrypt.hash(password, hashSalt);

        //update the database
        await helper.save();
        //creating jwt token
        const payload = {
            user: {
              /*this id is not in the model, however MongoDB generates object id with every record
              and mongoose provide an interface to use _id as id without using underscore*/
              id: helper.id,
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

// @route Post api/helper/login
// @desc authenticate user to login
// @access Public
router.post(
    '/login',
    [
      //check if the helper provided the values
      check('email', 'Email is required').isEmail(),
      check('password', 'Password is required').exists(),
    ],
    async (req, res) => {
      //when request is received, validate the helper data before proceeding further
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        //if there were some errors in the data received send the 400 response with the error message
        return res.status(400).json({ errors: errors.array() });
      } else {
        //if data is correct, then log helper
        try {
          //destructure the parameters
          const { password } = req.body;
          let {email} = req.body;
          email = email.toLowerCase();
          //find the helper with the email entered
          let helper = await Helper.findOne({ email });
  
          //if the helper already exists in the system then return from here
          if (!helper) {
            return res.status(400).json({ errors: [{ msg: 'Invalid Credentials' }] });
          }
          // check if the password entered password is correct or not by using bcrypt
          const valid = await bcrypt.compare(password, helper.password);
  
          if (!valid) {
            return res.status(400).json({ errors: [{ msg: 'Invalid Credentials' }] });
          }
  
          //create a payload to be used by jwt to create hash
          const payload = {
            user: {
              /*this id is not in the model, however MongoDB generates object id with every record
              and mongoose provide an interface to use _id as id without using underscore*/
              id: helper.id,
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

module.exports = router;
