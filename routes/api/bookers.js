//APIs related to a booker, someone who books a driver or a helper

const express = require('express');
const routeAuth = require('../../middleware/auth');
const bcrypt = require('bcryptjs');
const Booker = require('../../models/Booker');
const Driver = require('../../models/Driver');
const Helper = require('../../models/Helper');
const Availability = require('../../models/Availability');
const config = require('config');
const fn = require('../../libs/functions');
const router = express.Router();

const { check, validationResult } = require('express-validator');

// @route Post api/bookers
// @desc create/register booker
// @access Public
router.post(
  '/',
  [
    //validate the request parameters sent by the client
    check('name', 'Name is required').not().isEmpty(), //check if name is empty
    check('email', 'Enter a valid email').isEmail(), //use validator to validate an email
    check('password', 'Password length should be at least 8').isLength({
      //password should be matched according to the criteria defind in the line above
      min: 8,
    }),
    check('confirmPassword',"Both passowrds must match").custom((value,{req})=>{
      return value===req.body.password;
    }),
  ],
  async (req, res) => {
    //when request is received, validate the user data before proceeding further
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      //if there were some errors in the data received send the 400 response with the error message
      return res.status(400).json({ errors: errors.array() });
    } else {
      //if data is correct, create the user
      try {
        //destructure the parameters
        const { name, password } = req.body;
        let {email} = req.body;
        email = email.toLowerCase();
        //find the user with the email entered
        let booker = await Booker.findOne({ email });

        //if the booker already exists in the system then return from here
        if (booker) {
          return res
            .status(400)
            .json({ errors: [{ msg: 'Booker already exists in the system' }] });
        }
        //if this is the new booker then create new booker
        booker = new Booker({ name, email, password });

        //generate salt and hash the password of the user for protection
        //do not change the value from 10 as it will take more computation power and time
        const hashSalt = await bcrypt.genSalt(10);
        booker.password = await bcrypt.hash(password, hashSalt);

        //update the database
        await booker.save();
        //create a payload to be used by jwt to create hash
        const payload = {
          user: {
            /*this id is not in the model, however MongoDB generates object id with every record
            and mongoose provide an interface to use _id as id without using underscore*/
            id: booker.id,
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

// @route Post api/bookers/login
// @desc authenticate user to login
// @access Public
router.post(
  '/login',
  [
    //check if the user provided the values
    check('email', 'Email is required').isEmail(),
    check('password', 'Password is required').exists(),
  ],
  async (req, res) => {
    //when request is received, validate the user data before proceeding further
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      //if there were some errors in the data received send the 400 response with the error message
      return res.status(400).json({ errors: errors.array() });
    } else {
      //if data is correct, create the user
      try {
        //destructure the parameters
        const {password } = req.body;
        let {email} = req.body;
        email = email.toLowerCase();
        //find the user with the email entered
        let booker = await Booker.findOne({ email });

        //if the booker already exists in the system then return from here
        if (!booker) {
          return res.status(400).json({ errors: [{ msg: 'User not found!' }] });
        }
        // check if the password entered password is correct or not by using bcrypt
        const valid = await bcrypt.compare(password, booker.password);

        if (!valid) {
          return res.status(400).json({ errors: [{ msg: 'User not found!' }] });
        }

        //create a payload to be used by jwt to create hash
        const payload = {
          user: {
            /*this id is not in the model, however MongoDB generates object id with every record
            and mongoose provide an interface to use _id as id without using underscore*/
            id: booker.id,
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

// @route GET api/bookers/logout
// @desc logout functionality by checking the blacklist jwt
// @access Public
router.get('/logout', async (req, res) => {
  try {
    //call method to invalidate the jwt token by blacklisting it using DB
    //Redis could be a better option once the list grows
    fn.logout(req, res);
  } catch (err) {
    //something happened at the server side
    res.status(500).json({ errors: [{ msg: err.message }] });
  }
});

// @route DELETE api/bookers/
// @desc permanentaly delete the account of the booker
// @access Public
router.delete('/', routeAuth, async (req, res) => {
  try {
    //get the user containing the id from the request which we got after routeAuth was run
    let booker = req.user;
    const {password} = req.body;
    //get the user data from the database so that we can check whether the password user entered is right or not
    booker = await Booker.findById(booker.id);
    if(booker){
      // check if the password entered password is correct or not by using bcrypt
      const valid = await bcrypt.compare(password, booker.password);
      if(valid){
        booker = await Booker.findByIdAndDelete(booker.id);
        //return the deleted user for demonstrating purposes
        return res.status(200).json(booker);
      }
      //when user enters wrong password while deleting the account
      return res.status(401).json({errors:[{msg:"Incorrect Password!"}]})
    }
    return res.status(400).json({errors:[{msg:"Cannot find the booker!"}]})
  } catch (err) {
    //something happened at the server side
    res.status(500).json({ errors: [{ msg: err.message }] });
  }
});
module.exports = router;

// @route GET api/bookers/drivers
// @desc fetch the available drivers
// @access Public
// router.get('/drivers',async (req,res)=>{
//   try{
//     const drivers = await Driver.find().select('-password');
//     res.status(200).json(drivers);
//   }catch(err){
//     //something happened at the server side
//     res.status(500).json({ errors: [{ msg: err.message }] });
//   }
// });

// @route GET api/bookers/searchDrivers
// @desc fetch the available drivers based on the search criteria of the user
// @access Public
router.get('/searchDrivers',async (req,res)=>{
  try{
    let {carType,location} = req.query;
    //get the availabilities of secondary users -> helpers and drivers
    const values = await fn.getAvailabilities(req,res);
    if(values == null){
      return res.status(500).json({errors:[{msg:"Date cannot be lower than today's date!"}]}); 
    }
    availabilities =  values[0];
    availableEmails = values[1];
    //find drivers who are available 
    let availableUsers;
    //if both carType and location is provided
    if(typeof carType != typeof undefined  && typeof location != typeof undefined){
      availableUsers = await Driver.find({email:[...availableEmails],carType,location}).select("-password");
    }
    //if location is provided
    else if(typeof location != typeof undefined){
      availableUsers = await Driver.find({email:[...availableEmails],location}).select("-password");
    }
    //if carType is provided
    else if(typeof carType != typeof undefined){
      availableUsers = await Driver.find({email:[...availableEmails],carType}).select("-password");
    }
    else
    //if nothing is provided
    {
      availableUsers = await Driver.find({email:[...availableEmails]}).select("-password");
    }
    //join availability and other details of the drivers except password
    availableUsers = fn.getUsersWithAvaliability(availabilities,availableUsers);
    res.status(200).json(availableUsers);
  }catch(err){
    //something happened at the server side
    res.status(500).json({ errors: [{ msg: err.message }] });
  }
});

// @route GET api/bookers/searchHelpers
// @desc fetch the available helpers based on the search criteria of the user
// @access Public
router.get('/searchHelpers',async (req,res)=>{
  try{
    let {location} = req.query;
    //get the availabilities of secondary users -> helpers and drivers
    const values = await fn.getAvailabilities(req,res);
    if(values == null){
      return res.status(500).json({errors:[{msg:"Date cannot be lower than today's date!"}]}); 
    }
    availabilities =  values[0];
    availableEmails = values[1];
    //find helpers who are available 
    let availableUsers;
    
    //if location is provided
    if(typeof location != typeof undefined){
      availableUsers = await Helper.find({email:[...availableEmails],location}).select("-password");
    }
    
    //if nothing is provided
    else
    {
      availableUsers = await Helper.find({email:[...availableEmails]}).select("-password");
    }
    //join availability and other details of the helpers except password
    availableUsers = fn.getUsersWithAvaliability(availabilities,availableUsers);
    res.status(200).json(availableUsers);
  }catch(err){
    //something happened at the server side
    res.status(500).json({ errors: [{ msg: err.message }] });
  }
});