const jwt = require('jsonwebtoken');
const config = require('config');
const BlackList = require('../models/BlackList');
const Availability = require('../models/Availability');
const sgMail = require('@sendgrid/mail');
//@desc Add any functions separated from API routes

module.exports = {
  //method to create jwt for protected routes using id passed to it
  createJwtToken: function (payload, res) {
    jwt.sign(
      payload,
      config.get('jwtKey'),
      {
        expiresIn: 360000,
      },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  },
  //method to invalidate a token when user logs out of the system
  logout: async function (req, res) {
    const token = req.header('x-auth-token');
    //check if token exists in the header
    if (token) {
      //check if the token is already in the blacklist, when user tries to access logout directly
      const valid = await BlackList.findOne({ token });
      if (valid) {
        return res
          .status(200)
          .json({ errors: [{ msg: 'Token already invalidated!' }] });
      }
      //else add the token to the blacklist
      const blackList = new BlackList({ token });
      blackList.save();

      res.status(200).json({ errors: [{ msg: 'Token invalidated!' }] });
    } else {
      //if token is not provided
      res.status(400).json({ errors: [{ msg: 'Invalid request!' }] });
    }
  },
  //method to get the availabilities of the secondary users -> helpers and drivers
  getAvailabilities: async function(req,res){
    const {date} = req.query;
     //get the last Sunday's date -> AS driver and helper will be able to give availability for next 7 days, starting Sunday
    //if no date is provided take current date!
    const currentDate = date == null ? new Date() : new Date(date);
    //date cannot be in past 
    if(currentDate.toLocaleDateString() < new Date().toLocaleDateString()){
      return;
    }
    const currentDay = currentDate.getDay();
    //convert UTC to local EST and get the date 
    const lastSunday = new Date(new Date().setDate(currentDate.getDate() - currentDay)).toLocaleDateString();
    //now get all the avaliabilities
    let availableEmails = [];
    let availabilities = await Availability.find();
    availabilities = availabilities.filter((availability) => {
      //store the emails of the available drivers and helpers
      if(availability.dateUpdated.toLocaleDateString() == lastSunday)
        availableEmails.push(availability.email);
      return availability.dateUpdated.toLocaleDateString() == lastSunday;
    });
    return [availabilities, availableEmails];
  },
  //get availability and users' details combined 
  getUsersWithAvaliability:function(availabilities,availableUsers){
    return availableUsers.map((availableUser)=>{
      return availabilities.filter((availability)=>{
        return (availableUser.email == availability.email);
      }).map((availability)=>{
        if(availableUser.email == availability.email){
          availableUserDoc= {...availableUser._doc};
          availabilityDoc = {...availability._doc};
          //spread and combine the objects
          return {...availabilityDoc,...availableUserDoc}
        }
      })
    });
  },
  updateOrCreateAvailability : async (availability,user) => { 
    const newAvailability = {
      email:user.email,
      dateUpdated : new Date().toLocaleDateString()
    };
    newAvailability.availability = availability.map((availability)=>availability);
    //update the availability if exists or create new one
    return await Availability.findOneAndUpdate({email:user.email},newAvailability,{upsert:true,new:true});
  },
  //method to create jwt for forgot password
  createForgotToken:async (payload,res) => {
    try{
      const token = jwt.sign(
        payload,
        config.get('jwtForgotPassword'),
        {
          expiresIn: 900,
        }
      );
      return token;
    }
    catch(err){
      res.status(500).json({errors:[{msg : err.message}]});
    }
  },
    
    sendMail : (to,subject,html,res)=> {
      sgMail.setApiKey(config.get('SENDGRID_API_KEY'));
      const msg = {
        to, // Change to your recipient
        from:'tarunpreetsingh16@gmail.com', // Change to your verified sender
        subject,
        html,
      }
      sgMail
        .send(msg)
        .then(() => {
          res.status(200).json({msg:'Email has been sent to change your password'});
        })
        .catch((error) => {
          res.status(400).json({errors:[{msg:error.message}]});
        })
     }
};



