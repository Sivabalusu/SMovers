//APIs related to a booker, someone who books a driver or a helper

const express = require('express');
const bcrypt = require('bcryptjs');
const Booker = require('../../models/Booker');

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

        await booker.save();

        res.send('Booker route');
      } catch (err) {
        res.status(500).json([{ msg: 'Server Error' }]);
      }
    }
  }
);

module.exports = router;
