//APIs related to a helper, someone who is booked as a helper by a booker

const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const Driver= require('../../models/Driver');
const bcrypt = require('bcryptjs');
const Helper = require('../../models/Helper');

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
        const {name,email,password,confirmPassword,rate} = req.body;

        //find whether helper with entered email has already registered
        let helper= await Helper.findOne({email});

         //if the helper already exists in the system then return from here
        if(helper){
            return res.status(400).json({ errors: [{ msg: 'Helper already exists in the system' }] });
        }

        //if this is the new helper then create new helper
        helper=new Helper({name,email,password,confirmPassword,rate});

        //generate salt and hash the password of the drvier for protection
        const hashSalt = await bcrypt.genSalt(10);
        helper.password = await bcrypt.hash(password, hashSalt);
        helper.confirmPassword= await bcrypt.hash(confirmPassword,hashSalt);

        //update the database
        await helper.save();
        res.send("Helper Registered");
      }
      catch(err){
        res.status(500).json({ errors: err.message });
      }
    }
}
);


module.exports = router;
