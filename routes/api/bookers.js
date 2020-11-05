//APIs related to a booker, someone who books a driver or a helper

const express = require('express');
const routeAuth = require('../../middleware/auth');
const bcrypt = require('bcryptjs');
const Booker = require('../../models/Booker');
const Driver = require('../../models/Driver');
const Helper = require('../../models/Helper');
const {Bookings,Booking} = require('../../models/Booking');
const fn = require('../../libs/functions');
const jwt = require('jsonwebtoken');
const config = require('config');

const router = express.Router();

const { check, validationResult } = require('express-validator');
const { on } = require('../../models/Booker');
const { sendMail } = require('../../libs/functions');

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
        booker = ({...booker}._doc);
        delete booker.password;
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
    res.status(200).json(driver);
  }
  catch(err){
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
    res.status(200).json(helper);
  }
  catch(err){
    res.status(500).send('Server Error');
  }
});

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

// @route POST api/bookers/update
// @desc update user data 
// @access Public
router.post("/update",routeAuth,[
    //validate the request parameters sent by the client
    check('email', 'Enter a valid email').isEmail(), //use validator to validate an email
    check('phone',"Invalid phone number!").custom((value)=>{  
      if(typeof value != typeof undefined)
      {
        return /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/.test(value);
      }
      return true;      
    })
  ],async (req,res)=>{
      //when request is received, validate the user data before proceeding further
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        //if there were some errors in the data received send the 400 response with the error message
        return res.status(400).json({ errors: errors.array() });
      }else{
        try{
          const {phone} = req.body;
          const user = req.user;
          //check if the user already exists with the email id
          let {email} = req.body;
          email = email.toLowerCase();
          //find the user with the email entered
          let booker = await Booker.findOne({ email });

          //if the booker already exists in the system then return from here
          if (booker && booker.id != user.id) {
            return res
              .status(400)
              .json({ errors: [{ msg: 'Another account already exists with this email!' }] });
          }
          //update the user with new email and phone
          await Booker.findByIdAndUpdate({_id:user.id},{$set:{email,phone}})
          booker = await Booker.findById({_id:user.id});
          booker = ({...booker}._doc);
          delete booker.password;
          return res.status(200).json(booker);
        }catch(err){
          //something happened at the server side
          res.status(500).json({ errors: [{ msg: err.message }] });
        }
      }
    }
);
// @route POST api/bookers/updatePassword
// @desc update user password 
// @access Public
router.post("/updatePassword",routeAuth,[
  //validate the request parameters sent by the client
  check('currentPassword','Current password required!').not().isEmpty(),
  check('password', 'Password should have at least 8 chars!').custom((value)=>{
    return !(typeof value == typeof undefined || value == null || value.length < 8);
  }),
  check('confirmPassword','Passwords do not match!').custom((value,{req})=>{
    return value == req.body.password;
  }),
  check('currentPassword','Current and new passwords cannot be same!').custom((value,{req})=>{
    return !(value == req.body.password)
  })
  ],async (req,res)=>{
    //when request is received, validate the user data before proceeding further
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      //if there were some errors in the data received send the 400 response with the error message
      return res.status(400).json({ errors: errors.array() });
    }else{
      try{
        const {currentPassword} = req.body;
        let {password} = req.body;
        //check the current password of the user before updating the data with new password
        let booker = await Booker.findById({_id:req.user.id});
        const valid = await bcrypt.compare(currentPassword, booker.password);

        if (!valid) {
          return res.status(400).json({ errors: [{ msg: 'Current password is incorrect!' }] });
        }
        //generate salt and hash the password of the user for protection
        //do not change the value from 10 as it will take more computation power and time
        const hashSalt = await bcrypt.genSalt(10);
        password = await bcrypt.hash(password, hashSalt);

        //update the booker's password 
        booker = await (await Booker.findByIdAndUpdate({_id:booker.id},{$set:{password}}));
        booker = ({...booker}._doc);
        delete booker.password;
        return res.status(200).json(booker);
      }catch(err){
        //something happened at the server side
        res.status(500).json({ errors: [{ msg: err.message }] });
      }
    }
  }
);

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
    res.status(200).json(driver);
  }
  catch(err){
    res.status(500).send(err.message);
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
    res.status(200).json(helper);
  }
  catch(err){
    res.status(500).send('Server Error');
  }
});

// @route GET api/bookers/bookings
// @desc view previous bookings
// @access Public
router.get("/bookings",routeAuth,async (req,res)=>{
    try{
      // get booker email from the id 
      const booker = await Booker.findById({_id:req.user.id});
      //find bookings of the user logged in
      const bookings = await Bookings.find({bookerEmail:booker.email});
      if(bookings.length > 0)
        res.status(200).json(bookings[0].bookings);
      else
      res.status(400).json({errors:[{msg:"No bookings found!"}]});
    }catch(err){
      //something happened at the server side
      res.status(500).json({ errors: [{ msg: err.message }] });
    }
  }
);
// @route GET api/bookers/forgotPassword
// @desc change password when user is unable to login because they forgot the password;
// @access Public
router.get('/forgotPassword',
    [//validate the request parameters sent by the client
      check('email', 'Enter a valid email').isEmail(), //use validator to validate an email
    ],async (req,res)=>{
        //when request is received, validate the user data before proceeding further
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          //if there were some errors in the data received send the 400 response with the error message
          return res.status(400).json({ errors: errors.array() });
        }
        try{
          const {email} = req.body;
          //create a payload to be used by jwt to create hash
          const payload = {
            user: {
              /*this id is not in the model, however MongoDB generates object id with every record
              and mongoose provide an interface to use _id as id without using underscore*/
              email,
            },
          };
          //check if email address exists in the database
          //find the user with the email entered
          let booker = await Booker.findOne({ email});
          //if the booker already exists in the system then return from here
          if (booker) {            
            //create secret UID using jwt to be sent to user 
            const token = await fn.createForgotToken(payload,res);
            //create mail structure and send it to the user
            const link = `http://localhost:5000/api/bookers/changePassword/${token}`;
            const message = `<h2>${booker.name},</h2><br>
                             <h4>You requested to reset the password of S_Movers Account.</h4> <br>
                             <a href="${link}">
                              <button style="padding:1rem 1.5rem; background-color:orange;border-radius:10px;border:0;color:white">Change password</button>
                             </a><br>
                             <h5>Copyable Link : <a href="${link}">${link}</a></h5><br>
                             <h4><em>This link is valid for next 15 minutes. </em></h4><br>
                             <h4>Ignore if not requested by you or contact us regarding this.</h4>`;
            const to = req.body.email;
            const subject = "Update your password - S_MOVERS"; 
            fn.sendMail(to,subject,message,res);
          }
          else{
            res.status(404).json({errors: [{msg: 'User is not registered with us!'}] });
          }
        } catch (err) {
          //prints the error message if it fails to delete the helper profile.
          res.status(500).json({errors: [{msg: err.message}] });
        }
    }
);
// @route GET api/bookers/forgotPassword/id
// @desc create new password from the link sent to the mail
// @access Public
router.get('/changePassword/:id',
    [
      check('password', 'Password should have at least 8 chars!').custom((value)=>{
      return !(typeof value == typeof undefined || value == null || value.length < 8);
      }),
      check('confirmPassword','Passwords do not match!').custom((value,{req})=>{
        return value == req.body.password;
      }),
    ],async (req,res)=>{
        //when request is received, validate the user data before proceeding further
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          //if there were some errors in the data received send the 400 response with the error message
          return res.status(400).json({ errors: errors.array() });
        }
        try{
          let {password} = req.body;

          const jwtToken = req.params.id;
          //verify the token fetched using secret Key
          const jwtObject = jwt.verify(jwtToken, config.get('jwtForgotPassword'));
          //set the user in request to be used for updating the password for correct user
          const user = jwtObject.user;
          
          //generate salt and hash the password of the user for protection
          //do not change the value from 10 as it will take more computation power and time
          const hashSalt = await bcrypt.genSalt(10);
          password = await bcrypt.hash(password, hashSalt);

          //update the booker's password 
          booker = await Booker.findOneAndUpdate({email:user.email},{$set:{password}});
          booker = ({...booker}._doc);
          delete booker.password;
          return res.status(200).json(booker);
        } catch (err) {
          //prints the error message if it fails to delete the helper profile.
          res.status(500).json({errors: [{msg: err.message}] });
        }
    }
);
// @route GET api/bookers/profile
// @desc gets the booker profile
// @access Public
router.get('/profile',routeAuth,async (req,res)=>{
        try{
          //find the user with the email entered
          let booker = await Booker.findById({_id:req.user.id }).select('-password');
          if(!booker){
            return res.status(404).json("Unable to find user!");
          }
          res.status(200).json(booker);
        } catch (err) {
          //prints the error message if it fails to delete the helper profile.
          res.status(500).json({errors: [{msg: err.message}] });
        }
    }
);


// @route POST api/bookers/bookDriver
// @desc try to book a service -> Driver (Service cycle starts from here)
// @access Public
router.post('/bookDriver',routeAuth,
  [
    check('driverEmail', 'Invalid driver email!').isEmail(),
    check('pickUp.street','Pick up Street is needed!').custom((value)=>value.trim().length>0),
    check('pickUp.number','Pick up Apartment Number is needed!').custom((value)=>value.trim().length>0),
    check('pickUp.city','Pick up City is needed!').custom((value)=>value.trim().length>0),
    check('pickUp.province','Pick up Province is needed!').custom((value)=>value.trim().length>0),
    check('pickUp.zipCode','Pick up ZipCode is needed!').custom((value)=>value.trim().length>0),
    check('pickUp.country','Pick up Country is needed!').custom((value)=>  value.trim().length>0),
    check('drop.street','Pick up Street is needed!').custom((value)=>value.trim().length>0),
    check('drop.number','Pick up Apartment Number is needed!').custom((value)=>value.trim().length>0),
    check('drop.city','Pick up City is needed!').custom((value)=>value.trim().length>0),
    check('drop.province','Pick up Province is needed!').custom((value)=>value.trim().length>0),
    check('drop.zipCode','Pick up ZipCode is needed!').custom((value)=>value.trim().length>0),
    check('drop.country','Pick up Country is needed!').custom((value)=>value.trim().length>0),
    check('date','Date is required to schedule a job!').custom((value)=>value.trim().length>0),
    check('startTime','Start time is required').custom((value)=>value.trim().length>0),
    check('motive','Description of the service is required').custom((value)=>value.trim().length>0),
   ],async (req,res)=>{
   
      //when request is received, validate the user data before proceeding further
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        //if there were some errors in the data received send the 400 response with the error message
        return res.status(400).json({ errors: errors.array() });
      } try{
        const expiryTime = 2100000;
        //destructure the data posted by the client
        const {driverEmail,pickUp,drop,date,startTime,motive} = req.body;
        //find the booker to get the email address to send an email
        booker = await Booker.findById(req.user.id).select('-password');
        driver =  await Driver.findOne({email:driverEmail}).select('-password');
        if(!booker || !driver){
          return res.status(400).json({errors: [{msg: "Something happened!"}] });
        }
        //create new booking
        newBooking =  new Booking({driverEmail,
                                  driverName:driver.name,
                                  date,
                                  pickUp,
                                  drop,
                                  startTime,
                                  motive,
                                  carType:driver.carType,
                                  status:0});
        //check if bookings already exists for this user                                  
        var bookings = await Bookings.findOne({bookerEmail:booker.email});
        if(!bookings){
          //if this is the first time user is booking a service create new bookings document for this user
          bookings = new Bookings({
            bookerEmail:booker.email,
          })
        } 
        bookings.bookings.push(newBooking);
        await bookings.save();
        //create a payload to be used by jwt to create hash
        
        //store the last booking id for further use
        lastBookingId = bookings.bookings[bookings.bookings.length-1]._id ;
        const payload = {
          booking: {
            /*this id is not in the model, however MongoDB generates object id with every record
            and mongoose provide an interface to use _id as id without using underscore*/
            bookerEmail:booker.email,
            id:lastBookingId
          },
        };
        //create secret UID using jwt to be sent to user 
        const token = await fn.createBookingToken(payload,res);
        console.log(token);
        //create mail structure and send it to the user
        fn.sendRequestMail(token,driverEmail,booker,pickUp,drop,date,motive,startTime,res);
        //wait for expiration time of the request and get the status of the booking
        getStatus = async function(){
          await fn.customSetTimeout(expiryTime);
          return await fn.checkStatus(booker.email,lastBookingId);
        }
        value = await getStatus();
        //if 0 is returned that means booking has not been accepted by the driver and we need to cancel it
        if(!value){
          //remove the booking as it is not accepted within the defined period
          bookings.bookings = bookings.bookings.filter((value)=>{
            return String(value._id) != String(lastBookingId);
          })
          await bookings.save();
          //send mail back to user the booking was not accepted by the driver
          fn.sendAutomaticMail(token,driverEmail,booker,pickUp,drop,date,motive,startTime,"Driver",res);
        }
      } catch (err) {
        //prints the error message if it fails to delete the helper profile.
        res.status(500).json({errors: [{msg: err.message}] });
      }
  }
);
// @route POST api/bookers/bookHelper
// @desc try to book a service -> Driver (Service cycle starts from here)
// @access Public
router.post('/bookHelper',routeAuth,
  [
    check('helperEmail', 'Invalid helper email!').isEmail(),
    check('pickUp.street','Pick up Street is needed!').custom((value)=>value.trim().length>0),
    check('pickUp.number','Pick up Apartment Number is needed!').custom((value)=>value.trim().length>0),
    check('pickUp.city','Pick up City is needed!').custom((value)=>value.trim().length>0),
    check('pickUp.province','Pick up Province is needed!').custom((value)=>value.trim().length>0),
    check('pickUp.zipCode','Pick up ZipCode is needed!').custom((value)=>value.trim().length>0),
    check('pickUp.country','Pick up Country is needed!').custom((value)=>  value.trim().length>0),
    check('drop.street','Pick up Street is needed!').custom((value)=>value.trim().length>0),
    check('drop.number','Pick up Apartment Number is needed!').custom((value)=>value.trim().length>0),
    check('drop.city','Pick up City is needed!').custom((value)=>value.trim().length>0),
    check('drop.province','Pick up Province is needed!').custom((value)=>value.trim().length>0),
    check('drop.zipCode','Pick up ZipCode is needed!').custom((value)=>value.trim().length>0),
    check('drop.country','Pick up Country is needed!').custom((value)=>value.trim().length>0),
    check('date','Date is required to schedule a job!').custom((value)=>value.trim().length>0),
    check('startTime','Start time is required').custom((value)=>value.trim().length>0),
    check('motive','Description of the service is required').custom((value)=>value.trim().length>0),
   ],async (req,res)=>{
   
      //when request is received, validate the user data before proceeding further
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        //if there were some errors in the data received send the 400 response with the error message
        return res.status(400).json({ errors: errors.array() });
      } try{
        const expiryTime = 2100000;
        //destructure the data posted by the client
        const {helperEmail,pickUp,drop,date,startTime,motive} = req.body;
        //find the booker to get the email address to send an email
        booker = await Booker.findById(req.user.id).select('-password');
        helper = await Helper.findOne({email:helperEmail}).select('-password');
        if(!booker || !helper){
          return res.status(400).json({errors: [{msg: "Something happened!"}] });
        }
        //create new booking
        newBooking =  new Booking({helperEmail,
                                  helperName:helper.name,
                                  date,
                                  pickUp,
                                  drop,
                                  startTime,
                                  motive,
                                  status:0});
        //check if bookings already exists for this user                                  
        var bookings = await Bookings.findOne({bookerEmail:booker.email});
        if(!bookings){
          //if this is the first time user is booking a service create new bookings document for this user
          bookings = new Bookings({
            bookerEmail:booker.email,
          })
        } 
        bookings.bookings.push(newBooking);
        await bookings.save();
        //create a payload to be used by jwt to create hash
        
        //store the last booking id for further use
        lastBookingId = bookings.bookings[bookings.bookings.length-1]._id ;
        const payload = {
          booking: {
            /*this id is not in the model, however MongoDB generates object id with every record
            and mongoose provide an interface to use _id as id without using underscore*/
            bookerEmail:booker.email,
            id:lastBookingId
          },
        };
        //create secret UID using jwt to be sent to user 
        const token = await fn.createBookingToken(payload,res);
        console.log(token);
        //create mail structure and send it to the user
        fn.sendRequestMail(token,helperEmail,booker,pickUp,drop,date,motive,startTime,res);
        //wait for expiration time of the request and get the status of the booking
        getStatus = async function(){
          await fn.customSetTimeout(expiryTime);
          return await fn.checkStatus(booker.email,lastBookingId);
        }
        value = await getStatus();
        //if 0 is returned that means booking has not been accepted by the driver and we need to cancel it
        if(!value){
          //remove the booking as it is not accepted within the defined period
          bookings.bookings = bookings.bookings.filter((value)=>{
            return String(value._id) != String(lastBookingId);
          })
          await bookings.save();
          //send mail back to user the booking was not accepted by the driver
          fn.sendAutomaticMail(token,helperEmail,booker,pickUp,drop,date,motive,startTime,"Helper",res);
        }
      } catch (err) {
        //prints the error message if it fails to delete the helper profile.
        res.status(500).json({errors: [{msg: err.message}] });
      }
  }
);
// @route POST api/bookers/bookHelper
// @desc try to book a service -> Driver (Service cycle starts from here)
// @access Public
router.get('/futureBooking',routeAuth,async (req,res)=>{
     try{
       //try getting the booker email for future purposes
        booker = await Booker.findById(req.user.id).select('-password');
        if(!booker){
          res.status(500).json({errors: [{msg: 'Unable to find the booker!'}] });
        }
        //get the bookings of a booker
        bookings = await Bookings.findOne({bookerEmail:booker.email});
        let futureBookings = [];
        //check if bookings exist for the user
        if(bookings){
          today = new Date();
          //filter bookings which are ahead of today's date and are not in pending state
          futureBookings = bookings.bookings.filter((value)=>{
            return value.date.getTime() > today.getTime() && value.status != 0
          })
        }
        res.status(200).json(futureBookings);
      } catch (err) {
        //prints the error message if it fails to delete the helper profile.
        res.status(500).json({errors: [{msg: err.message}] });
      }
  }
);
module.exports = router;