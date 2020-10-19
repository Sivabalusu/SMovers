//Availability model for MongoDB containing availability of driver or helper
const mongoose = require('mongoose');

const AvailabilitySchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  dateUpdated: {
    type: Date,
    default: Date.now,
  },
  availability:{
      type:Array,
      required:true
  }
});

module.exports = Availability = mongoose.model('availabilities', AvailabilitySchema);
