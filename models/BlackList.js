//Booker model for MongoDB containing fields / properties of a booker
const mongoose = require('mongoose');

const BlackListSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    unique: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = BlackList = mongoose.model('blacklist', BlackListSchema);
