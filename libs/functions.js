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
};
