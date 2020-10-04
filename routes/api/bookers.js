//APIs related to a booker, someone who books a driver or a helper

const express = require('express');
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
  (req, res) => {
    //when request is received, validate the user data before proceeding further
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      //if there were some errors in the data received send the 400 response with the error message
      return res.status(400).json({ errors: errors.array() });
    } else {
      //if data is correct, create the user
      res.json('done!');
    }
  }
);

module.exports = router;
