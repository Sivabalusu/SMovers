//APIs related to a booking

const express = require('express');
const router = express.Router();

// @route GET api/bookings
// @desc Test router
// @access Public
router.get('/', (req, res) => res.send('Booking Route'));

module.exports = router;
