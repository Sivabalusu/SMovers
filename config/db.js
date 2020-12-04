//DB connection file separated from server.js to not make it cluttered
const mongoose = require('mongoose'); //mongoose for mongoDB interface
// const config = require('config'); //for applying global variables -- will be removed once deployed. Will use env variables instead
const config = require('./../config/production.json');
const db = config.get('mongoURI'); //get the global variable to connecto to DB using config

//Connection to DB
const connectDB = async () => {
	try {
		//try connecting to the data by starting the promise
		await mongoose.connect(db, {
			useNewUrlParser: true,
			useUnifiedTopology: true,
			useCreateIndex: true,
			useFindAndModify: false,
		});
	} catch (err) {
		//if any error occured while connecting to database
		console.error(err.message);
		//Kill the process because something wrong happened
		process.exit(1);
	}
};

module.exports = connectDB;
