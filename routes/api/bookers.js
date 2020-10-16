//APIs related to a booker, someone who books a driver or a helper

const express = require('express');
const routeAuth = require('../../middleware/auth');
const bcrypt = require('bcryptjs');
const Booker = require('../../models/Booker');
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
        const { name, email, password } = req.body;

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
        const { email, password } = req.body;

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

// @route GET api/booker/driver/:driver_id
// @desc View Driver's Profile by providing driver id 
// @access private
router.get('/driver/:driver_id', async(req,res) =>{
  try{
    const id=req.params.driver_id;
    //pass the driver_id as parameter
    const driver = await Driver.findOne({_id:id}).select('-password');
    if(!driver){
      //if there is no driver data
      return res.status(400).json({msg:'Driver data not found'});
    }
    //send driver data as response
    res.json(driver);
  }
  catch(err){
    console.error(err.message);
    if(err.kind=='ObjectId'){
      return res.status(400).json({msg:'Driver data not found'});
    }
    res.status(500).send('Server Error');
  }
});


// @route GET api/helpers/view/:helper_id
// @desc View helper profile functionality by providing helper id
// @access private
router.get('/helper/:helper_id', async(req,res) =>{
  try{
    //pass the helper_id as parameter
    const id=req.params.helper_id;
    const helper = await Helper.findOne({_id:id}).select('-password');
    if(!helper){
      //If there is no helper data
      return res.status(400).json({msg:'helper data not found'});
    }
    //send driver data as response
    res.json(helper);
  }
  catch(err){
    console.error(err.message);
    if(err.kind=='ObjectId'){
      return res.status(400).json({msg:'Helper data not found'});
    }
    res.status(500).send('Server Error');
  }
});

module.exports = router;
