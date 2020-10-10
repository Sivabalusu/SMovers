//APIs related to the authorisation of a user
const express = require('express');
const routeAuth = require('../../middleware/auth');
const router = express.Router();
const Booker = require('../../models/Booker');
const Driver = require('../../models/Driver');
const { users } = require('../../libs/enums');
const Helper = require('../../models/Helper');

// @route GET api/auth
// @desc Authorisation is done
// @access Public
router.get('/:id', routeAuth, async (req, res) => {
  try {
    //fetch user  using the user id fetched from the web token
    //exclude the password as we do not want to display user's password anywhere

    //get the user details based on the type of user logged in
    switch (req.params.id) {
      case users.BOOKER:
        const booker = await Booker.findById(req.user.id).select('-password');
        //send back the booker to the user
        return res.json(booker);
      case users.DRIVER:
        const driver = await Driver.findById(req.user.id).select('-password');
        return res.json(driver);
      case users.HELPER:
        const helper = await Helper.findById(req.user.id).select('-password');
        return res.json(helper);
      default:
        return res.status(400).json({ errors: [{ msg: 'Invalid route!' }] });
    }
  } catch (err) {
    res.status(500).json({ errors: [{ msg: err.message }] });
  }
});

module.exports = router;
