const jwt = require('jsonwebtoken');
const config = require('config');
const BlackList = require('../models/BlackList');
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
  }
};

