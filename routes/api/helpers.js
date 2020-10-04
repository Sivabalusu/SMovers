//APIs related to a helper, someone who is booked as a helper by a booker

const express = require('express');
const router = express.Router();

// @route GET api/helpers
// @desc Test router
// @access Public
router.get('/', (req, res) => res.send('Helpers Route'));

module.exports = router;
