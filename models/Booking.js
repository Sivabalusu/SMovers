//Booking model for MongoDB containing fields / properties of a booking
const mongoose = require('mongoose');
// const Address = require('./Address');
const AddressSchema = new mongoose.Schema({
    street:{
        type:String
    },
    number:{
        type:Number
    },
    city:{
        type:String
    },
    province:{
        type:String
    },
    zipCode:{
        type:String
    },
    country:{
        type:String
    }
});

const Address = mongoose.model('address',AddressSchema);

const BookingSchema = new mongoose.Schema( {
    driverEmail:{
        type:String
    },
    helperEmail:{
        type:String
    },
    driverName:{
        type:String
    },
    helperName:{
        type:String
    },
    date:{
        type:Date,
        default:Date.now
    },
    pickUp:{
        type:AddressSchema
    },
    drop:{
        type:AddressSchema
    },
    carType:{
        type:String
    }
});

const Booking = mongoose.model('booking',BookingSchema);

const BookingsSchema = new mongoose.Schema({
  bookerEmail: {
    type: String,
    required: true,
  },
  bookings:[BookingSchema]
});
const Bookings = mongoose.model('bookings',BookingsSchema);
module.exports = { Address,
                   Booking,
                   Bookings}
