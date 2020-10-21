//Booker model for MongoDB containing fields / properties of a booker
const mongoose = require('mongoose');

const BookerSchema = new mongoose.Schema({
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
  date: {
    type: Date,
    default: Date.now,
  },
  phone:{
    type: String,
  }
});

module.exports = Booker = mongoose.model('booker', BookerSchema);
