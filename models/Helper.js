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
      min:0,
      max:5,
  },
  totalTrips:{
      type:Number,
      default:0,
  },
  location:{
    type:String,
    required:true
  }
});

module.exports = Helper = mongoose.model('helper', HelperSchema);