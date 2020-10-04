//APIs related to the authorisation of a user
const express = require('express');
const routeAuth = require('../../middleware/auth');
const router = express.Router();
const Booker = require('../../models/Booker');

// @route GET api/auth
// @desc Authorisation is done
// @access Public
router.get('/', routeAuth, async (req, res) => {
  try {
    //fetch booker using the booker id fetched from the web token
    //exclude the password as we do not want to display user's password anywhere
    const booker = await Booker.findById(req.booker.id).select('-password');
    //send back the booker to the user
    res.json(booker);
  } catch (err) {
    res.status(500).json({ errors: [{ msg: err.message }] });
  }
});

module.exports = router;
