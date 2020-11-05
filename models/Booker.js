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
  },
  rating:{
    type:Number,
    min:0,
    max:5,
}
});

module.exports = Booker = mongoose.model('booker', BookerSchema);
