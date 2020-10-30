const express = require('express');
const connectDB = require('./config/db');
const app = express();

//Connect to the Database
connectDB();
// Parse URL-encoded bodies (as sent by HTML forms)
app.use(express.urlencoded());

// Parse JSON bodies (as sent by API clients)
app.use(express.json());

// Routes to APIs
app.use('/api/bookers', require('./routes/api/bookers'));
app.use('/api/auth', require('./routes/api/auth'));
app.use('/api/helpers', require('./routes/api/helpers'));
app.use('/api/drivers', require('./routes/api/drivers'));
app.use('/api/bookings', require('./routes/api/bookings'));

const PORT = process.env.PORT || 5000;

//@ !!!important  uncomment next line if doing dev or production and comment next to next line
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));

//@ !!!important  uncomment next line if doing testing and comment above line
// module.exports = app;
