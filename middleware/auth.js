const jwt = require('jsonwebtoken');
const config = require('config');
const BlackList = require('../models/BlackList');

//to verify the authorization of the request made
module.exports = async function (req, res, next) {
  //fetch token from the header to create private route for the user
  const jwtToken = req.header('x-auth-token');
  //check if the token is present in request header
  if (!jwtToken) {
    return res.status(401).json({
      errors: [{ msg: 'No token provided, authorization not granted!' }],
    });
  }

  //if the token is provided by the client in the header then verify the token
  try {
    //check if jwt is blacklisted or not
    const blackListed = await BlackList.findOne({ token: jwtToken });
    //if the token is blaclisted that means the user is not logged in and cannot be authorised
    if (blackListed) {
      return res
        .status(400)
        .json({ errors: [{ msg: 'Invalid session! blacklisted!' }] });
    }
    //verify the token fetched using secret Key
    const jwtObject = jwt.verify(jwtToken, config.get('jwtKey'));
    //set the user in request to be used for fitite routes or api hits
    req.user = jwtObject.user;
    next();
  } catch (err) {
    res.status(401).json({
      errors: [{ msg: 'Invalid Token!' }],
    });
  }
};
