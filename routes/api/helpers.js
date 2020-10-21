//APIs related to a helper, someone who is booked as a helper by a booker

const express = require('express');
const routeAuth = require('../../middleware/auth');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const Helper = require('../../models/Helper');
const config = require('config');
const fn = require('../../libs/functions');
const auth=require('../../middleware/auth');

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

// @route GET api/helpers/view/:helper_id
// @desc View helper profile functionality by using jwt login token
// @access private
// router.get('/view/:helper_id', auth, async(req,res) =>{
//   try{
//     //pass the helper_id as parameter
//     const id=req.params.helper_id;
//     const helper = await Helper.findOne({_id:id}).select('-password');
//     if(!helper){
//       //If there is no helper data
//       return res.status(400).json({msg:'helper data not found'});
//     }
//     //send driver data as response
//     res.json(helper);
//   }
//   catch(err){
//     console.error(err.message);
//     if(err.kind=='ObjectId'){
//       return res.status(400).json({msg:'Helper data not found'});
//     }
//     res.status(500).send('Server Error');
//   }
// });

// @route POST api/helpers/update/:helper_id
// @desc View helper profile functionality by using jwt login token
// @access public
router.post('/update/:helper_id', auth, async(req,res) =>{
  try{
    //pass the helper_id as parameter
    const id=req.params.helper_id;
    //read the updates from request body
    const updates=req.body;
    //in mongoose, the updated values won't appear immediately current post request
    //to get new updated values to post request we need to set options to true
    const options= {new:true};
    const update = await Helper.findOneAndUpdate({_id:id},updates,options);
    if(!update){
      //If there is no helper data
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


// @route Post api/helpers/logout
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

// @route Delete api/helper
// @desc delete functionality to delete the helper profile.
// @access Public
router.delete('/', routeAuth, async(req, res) =>{
  try{
    //get the user containing the id from the request which we got after routeAuth was run
    let helper = req.user;
    const {password} = req.body;
    //get the user data from the database so that we can check whether the password user entered is right or not
    helper = await Helper.findById(helper.id);
    if(helper){
      // check if the password entered password is correct or not by using bcrypt
      const valid = await bcrypt.compare(password, helper.password);
      if(valid){
        helper = await Helper.findByIdAndDelete(helper.id);
        //return the deleted user for demonstrating purposes
        return res.status(200).json(helper);
      }
      //when user enters wrong password while deleting the account
      return res.status(400).json({errors:[{msg:"Incorrect Password!"}]})
      return res.status(401).json({errors:[{msg:"Incorrect Password!"}]})
    }
    return res.status(400).json({errors:[{msg:"Cannot find the helper!"}]})
  } catch (err) {
    //prints the error message if it fails to delete the helper profile.
    console.error(err.message);
    res.status(500).json({errors: [{msg: err.message}] });
  }
});

module.exports = router;
