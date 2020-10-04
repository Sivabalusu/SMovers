//APIs related to a driver, someone who is booked by a booker

const express = require('express');
const router = express.Router();

// @route GET api/drivers
// @desc Test router
// @access Public
router.get('/', (req, res) => res.send('Drivers Route'));

module.exports = router;
