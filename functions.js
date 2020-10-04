const jwt = require('jsonwebtoken');
const config = require('config');
//@desc Add any functions separated from API routes

//method to create jwt for protected routes using id passed to it
module.exports = {
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
};
