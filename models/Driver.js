//Driver model for MongoDB containing fields / properties of a Driver
const mongoose = require('mongoose');

const DriverSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  rate: {
    type: Number,
    required:true,
  },
  rating:{
      type:Number,
      min:1,
      max:5,
  },
  totalTrips:{
      type:Number,
  },
  licenseIssuedDate:{
      type:Date,
      required:true,
  }
});

module.exports = Driver = mongoose.model('driver', DriverSchema);