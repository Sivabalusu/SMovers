//Helper model for MongoDB containing fields / properties of a Helper

const mongoose = require('mongoose');

const HelperSchema = new mongoose.Schema({
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
      default:0,
  },
});

module.exports = Helper = mongoose.model('helper', HelperSchema);