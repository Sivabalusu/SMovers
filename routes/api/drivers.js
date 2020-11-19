//APIs related to a driver, someone who is booked by a booker

const express = require('express');
const routeAuth = require('../../middleware/auth');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const Driver = require('../../models/Driver');
const Availability = require('../../models/Availability');
const Blacklist = require('../../models/BlackList');
const bcrypt = require('bcryptjs');
const config = require('config');
const jwt = require('jsonwebtoken');
const fn = require('../../libs/functions');
const { Bookings, Booking } = require('../../models/Booking');

// @route  POST api/drivers
// @desc   Register router
// @access Public
router.post(
	'/',
	[
		//validate the request parameters sent by the client
		check('name', 'Name is required').not().isEmpty(), //check if name is empty
		check('email', 'Enter a valid email').isEmail(), //use validator to validate an email
		check('password', 'Password length should be at least 8').isLength({
			//password should be matched according to the criteria defind in the line above
			min: 8,
		}),
		check('confirmPassword', 'Both passwords must match').custom(
			(value, { req }) => {
				return value === req.body.password;
			}
		),
		check('rate', 'Rate (cost/km) is required').not().isEmpty(),
		check('licenseIssuedDate', 'License issued date is mandatory')
			.not()
			.isEmpty(),
		check('carType', 'Have to enter your car type').not().isEmpty(),
		check('drivingExperience', 'Driving experience in years is required')
			.not()
			.isEmpty(),
		check('location', 'Location (city) is required').not().isEmpty(),
	],
	async (req, res) => {
		//when request is received, validate the driver data before proceeding further
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			//if there were some errors in the data received send the 400 response with the error message
			return res.status(400).json({ errors: errors.array() });
		} else {
			//if data is correct, add the driver
			try {
				//destructure the parameters
				const {
					name,
					password,
					rate,
					licenseIssuedDate,
					carType,
					drivingExperience,
					location,
				} = req.body;
				let { email } = req.body;
				email = email.toLowerCase();
				//find whether driver with entered email has already registered
				let driver = await Driver.findOne({ email });

				//if the driver already exists in the system then return from here
				if (driver) {
					return res
						.status(400)
						.json({ errors: [{ msg: 'Driver already exists in the system' }] });
				}
				//if this is the new driver then create new driver
				driver = new Driver({
					name,
					email,
					password,
					rate,
					licenseIssuedDate,
					carType,
					drivingExperience,
					location,
					rating: 0,
				});

				//generate salt and hash the password of the drvier for protection
				const hashSalt = await bcrypt.genSalt(10);
				driver.password = await bcrypt.hash(password, hashSalt);

				//update the database
				await driver.save();
				//creating jwt token
				const payload = {
					user: {
						/*this id is not in the model, however MongoDB generates object id with every record
              and mongoose provide an interface to use _id as id without using underscore*/
						id: driver.id,
					},
				};
				//get jwt, json web token
				fn.createJwtToken(payload, res);
			} catch (err) {
				res.status(500).json({ errors: err.message });
			}
		}
	}
);

// @route Post api/driver/login
// @desc authenticate user to login
// @access Public
router.post(
	'/login',
	[
		//check if the driver provided the values
		check('email', 'Email is required').isEmail(),
		check('password', 'Password is required').exists(),
	],
	async (req, res) => {
		//when request is received, validate the driver data before proceeding further
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			//if there were some errors in the data received send the 400 response with the error message
			return res.status(400).json({ errors: errors.array() });
		} else {
			//if data is correct, then log driver
			try {
				//destructure the parameters
				const { password } = req.body;
				let { email } = req.body;
				email = email.toLowerCase();
				//find the driver with the email entered
				let driver = await Driver.findOne({ email });

				//if the driver already exists in the system then return from here
				if (!driver) {
					return res
						.status(400)
						.json({ errors: [{ param: 'notFound', msg: 'User not found!' }] });
				}
				// check if the password entered password is correct or not by using bcrypt
				const valid = await bcrypt.compare(password, driver.password);

				if (!valid) {
					return res
						.status(400)
						.json({ errors: [{ param: 'notFound', msg: 'User not found!' }] });
				}

				//create a payload to be used by jwt to create hash
				const payload = {
					user: {
						/*this id is not in the model, however MongoDB generates object id with every record
              and mongoose provide an interface to use _id as id without using underscore*/
						id: driver.id,
					},
				};
				//get jwt, json web token
				fn.createJwtToken(payload, res);
			} catch (err) {
				res.status(500).json({ errors: err.message });
			}
		}
	}
);

// @route GET api/drivers/profile
// @desc View Driver Profile functionality by using jwt login token
//@access Public
router.get('/profile', routeAuth, async (req, res) => {
	try {
		let driver = await Driver.findById({ _id: req.user.id }).select(
			'-password'
		);
		if (!driver) {
			res.status(404).json('Unable to find the Driver');
		}
		res.status(200).send(driver);
	} catch (err) {
		//prints the error message if it fails to load driver's profile
		res.status(500).json({ errors: [{ msg: err.message }] });
	}
});

// @route POST api/drivers/update
// @desc Update driver profile functionality
// @access public
router.post(
	'/update',
	routeAuth,
	[
		//validate the request parameters sent by the client
		check('email', 'Enter a valid email').isEmail(), //use validator to validate an email
		check('carType', 'Car type is required').not().isEmpty(),
		check('drivingExperience', 'Driving Experience is required')
			.not()
			.isEmpty(),
		check('location', 'Location is required').not().isEmpty(),
	],
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			//if there were some errors in the data received send the 400 response with the error message
			return res.status(400).json({ errors: errors.array() });
		}
		try {
			//get the user containing the id from the request which we got after routeAuth was run
			let driver = req.user;
			//read the updates from request body
			let updates = req.body;
			updates.email = updates.email.toLowerCase();
			//if the driver already exists in the system then return from here
			let existing = await Driver.find({ email: updates.email });
			if (existing.length > 0 && existing[0]._id != driver.id) {
				return res.status(400).json({
					errors: [
						{
							param: 'email',
							msg: 'Another account already exists with this email!',
						},
					],
				});
			}
			//in mongoose, the updated values won't appear immediately current post request
			//to get new updated values to post request we need to set options to true
			const options = { new: true };
			update = await Driver.findByIdAndUpdate(driver.id, updates, options);
			if (!update) {
				//If there is no driver data
				return res.status(400).json({ msg: 'Update failed' });
			}
			update = { ...update }._doc;
			delete update.password;
			//send driver data as response
			res.status(200).json(update);
		} catch (err) {
			res.status(500).send('Server Error');
		}
	}
);

// @route POST api/drivers/updatePassword
// @desc View driver profile functionality by using jwt login token
// @access public
router.post(
	'/updatePassword',
	routeAuth,
	[
		//validate the request parameters sent by the client
		check('currentPassword', 'Current password required!').not().isEmpty(),
		check('password', 'Password should have at least 8 chars!').custom(
			(value) => {
				return !(
					typeof value == typeof undefined ||
					value == null ||
					value.length < 8
				);
			}
		),
		check('confirmPassword', 'Passwords do not match!').custom(
			(value, { req }) => {
				return value == req.body.password;
			}
		),
		check('currentPassword', 'Current and new password cannot be same!').custom(
			(value, { req }) => {
				return !(value == req.body.password);
			}
		),
	],
	async (req, res) => {
		//when request is received, validate the user data before proceeding further
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			//if there were some errors in the data received send the 400 response with the error message
			return res.status(400).json({ errors: errors.array() });
		} else {
			try {
				const { currentPassword } = req.body;
				let { password } = req.body;
				//check the current password of the user before updating the data with new password
				let driver = await Driver.findById({ _id: req.user.id });
				const valid = await bcrypt.compare(currentPassword, driver.password);

				if (!valid) {
					return res.status(400).json({
						errors: [
							{
								param: 'currentPassword',
								msg: 'Current password is incorrect!',
							},
						],
					});
				}
				//generate salt and hash the password of the user for protection
				//do not change the value from 10 as it will take more computation power and time
				const hashSalt = await bcrypt.genSalt(10);
				password = await bcrypt.hash(password, hashSalt);

				//update the booker's password
				driver = await Driver.findByIdAndUpdate(
					{ _id: driver.id },
					{ $set: { password } }
				);
				driver = { ...driver }._doc;
				delete driver.password;
				return res.status(200).json(driver);
			} catch (err) {
				//something happened at the server side
				res.status(500).json({ errors: [{ msg: err.message }] });
			}
		}
	}
);

// @route GET api/drivers/logout
// @desc logout functionality by checking the blacklist jwt
// @access Public
router.get('/logout', async (req, res) => {
	try {
		//call method to invalidate the jwt token by blacklisting it using DB
		fn.logout(req, res);
	} catch (err) {
		//something happened at the server side
		res.status(500).json({ errors: [{ msg: err.message }] });
	}
});

// @route Delete api/drivers
// @desc delete functionality to delete the driver profile.
// @access Public
router.delete('/', routeAuth, async (req, res) => {
	try {
		//get the user containing the id from the request which we got after routeAuth was run
		let driver = req.user;
		const { password } = req.body;
		//get the user data from the database so that we can check whether the password user entered is right or not
		driver = await Driver.findById(driver.id);
		if (driver) {
			// check if the password entered password is correct or not by using bcrypt
			const valid = await bcrypt.compare(password, driver.password);
			if (valid) {
				driver = await Driver.findByIdAndDelete(driver.id);
				driver = { ...driver }._doc;
				delete driver.password;
				//return the deleted user for demonstrating purposes
				return res.status(200).json(driver);
			}
			//when user enters wrong password while deleting the account
			return res
				.status(401)
				.json({ errors: [{ param: 'password', msg: 'Incorrect Password!' }] });
		}
		return res
			.status(400)
			.json({ errors: [{ msg: 'Cannot find the driver!' }] });
	} catch (err) {
		//prints the error message if it fails to delete the driver profile.
		res.status(500).json({ errors: [{ msg: err.message }] });
	}
});

// @route PUT api/drivers/
// @desc Provide availability for next 7 days;
// @access Public
router.put('/', routeAuth, async (req, res) => {
	try {
		//check if it is Sunday so that user cannot update on any other day
		//===>>>   0 = Sunday

		if (new Date().getDay() !== 0) {
			return res.status(400).json({
				errors: [{ msg: 'Cannot update on any other day but Sunday' }],
			});
		}
		availability = req.body.availability;
		if (availability.length != 7) {
			return res
				.status(400)
				.json({ errors: [{ msg: "Week's availability is required!" }] });
		}
		//get the user containing the id from the request which we got after routeAuth was run
		let driver = req.user;
		//get the user data from the database so that we can check whether the password user entered is right or not
		driver = await Driver.findById(driver.id);
		if (driver) {
			currentAvailability = await fn.updateOrCreateAvailability(
				availability,
				driver,
				res
			);
			return res.json(currentAvailability);
		}
		res.status(400).json({ errors: [{ msg: 'Cannot find the driver!' }] });
	} catch (err) {
		//prints the error message if it fails to delete the driver profile.
		res.status(500).json({ errors: [{ msg: err.message }] });
	}
});
// @route GET api/drivers/forgotPassword
// @desc change password when user is unable to login because they forgot the password;
// @access Public
router.get(
	'/forgotPassword',
	[
		//validate the request parameters sent by the client
		check('email', 'Enter a valid email').isEmail(), //use validator to validate an email
	],
	async (req, res) => {
		//when request is received, validate the user data before proceeding further
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			//if there were some errors in the data received send the 400 response with the error message
			return res.status(400).json({ errors: errors.array() });
		}
		try {
			const { email } = req.body;
			//create a payload to be used by jwt to create hash
			const payload = {
				user: {
					/*this id is not in the model, however MongoDB generates object id with every record
              and mongoose provide an interface to use _id as id without using underscore*/
					email,
				},
			};
			//check if email address exists in the database
			//find the user with the email entered
			let driver = await Driver.findOne({ email });
			//if the driver already exists in the system then return from here
			if (driver) {
				//create secret UID using jwt to be sent to user
				const token = await fn.createForgotToken(payload, res);
				//create mail structure and send it to the user
				const link = `http://localhost:5000/api/drivers/changePassword/${token}`;
				const message = `<h2>${driver.name},</h2><br>
                             <h4>You requested to reset the password of S_Movers Account.</h4> <br>
                             <a href="${link}">
                              <button style="padding:1rem 1.5rem; background-color:orange;border-radius:10px;border:0;color:white">Change password</button>
                             </a><br>
                             <h5>Copyable Link : <a href="${link}">${link}</a></h5><br>
                             <h4><em>This link is valid for next 15 minutes. </em></h4><br>
                             <h4>Ignore if not requested by you or contact us regarding this.</h4>`;
				const to = req.body.email;
				const subject = 'Update your password - S_MOVERS';
				fn.sendMail(to, subject, message, res);
				if (result >= 200 && result <= 300)
					res.status(200).json({ msg: 'Email sent to change the password' });
			} else {
				res
					.status(404)
					.json({ errors: [{ msg: 'User is not registered with us!' }] });
			}
		} catch (err) {
			//prints the error message if it fails to delete the helper profile.
			res.status(500).json({ errors: [{ msg: err.message }] });
		}
	}
);

// @route GET api/drivers/changePassword/id
// @desc create new password from the link sent to the mail
// @access Public
router.post(
	'/changePassword/:id',
	[
		check('password', 'Password should have at least 8 chars!').custom(
			(value) => {
				return !(
					typeof value == typeof undefined ||
					value == null ||
					value.length < 8
				);
			}
		),
		check('confirmPassword', 'Passwords do not match!').custom(
			(value, { req }) => {
				return value == req.body.password;
			}
		),
	],
	async (req, res) => {
		//when request is received, validate the user data before proceeding further
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			//if there were some errors in the data received send the 400 response with the error message
			return res.status(400).json({ errors: errors.array() });
		}
		try {
			let { password } = req.body;

			const jwtToken = req.params.id;
			//verify the token fetched using secret Key
			const jwtObject = jwt.verify(jwtToken, config.get('jwtForgotPassword'));
			//set the user in request to be used for updating the password for correct user
			const user = jwtObject.user;

			//generate salt and hash the password of the user for protection
			//do not change the value from 10 as it will take more computation power and time
			const hashSalt = await bcrypt.genSalt(10);
			password = await bcrypt.hash(password, hashSalt);

			//update the driver's password
			driver = await Driver.findOneAndUpdate(
				{ email: user.email },
				{ $set: { password } }
			);
			driver = { ...driver }._doc;
			delete driver.password;
			return res.status(200).json(driver);
		} catch (err) {
			//prints the error message if it fails to delete the helper profile.
			res.status(500).json({ errors: [{ msg: err.message }] });
		}
	}
);

// @route GET api/drivers/availability
// @desc Get Driver Availability for that week
//@access Public
router.get('/availability', routeAuth, async (req, res) => {
	try {
		//get the user containing the id from the request which we got after routeAuth was run
		let driver = req.user;
		//get the user data from the database so that we can check whether the password user entered is right or not
		driver = await Driver.findById(driver.id);
		if (driver) {
			availability = await Availability.findOne({ email: driver.email });
			return res.json(availability);
		}
		res.status(400).json({ errors: [{ msg: 'Cannot find the driver!' }] });
	} catch (err) {
		res.status(500).json({ errors: [{ msg: err.message }] });
	}
});

// // @route GET api/drivers/futureBookings
// // @desc view upcoming bookings
// // @access Public
router.get('/futureBookings', routeAuth, async (req, res) => {
	try {
		// get booker email from the id
		const driver = await Driver.findById({ _id: req.user.id });
		bookings = await Bookings.find();
		//filter the bookings based on driver email, future date and bookings which are not in pending State
		bookings = bookings.filter((value) => {
			return (value.bookings = value.bookings.filter((value) => {
				return (
					value.driverEmail == driver.email &&
					value.date.getTime() > new Date().getTime() &&
					value.status != 0
				);
			}));
		});
		console.log(bookings);
		res.status(200).json(bookings);
	} catch (err) {
		//something happened at the server side
		res.status(500).json({ errors: [{ msg: err.message }] });
	}
});

// @route POST api/drivers/cancelBooking
// @desc Driver cancels accepted booking
// @access Public
router.post('/cancelBooking/:id', routeAuth, async (req, res) => {
	try {
		const bookerEmail = req.body.bookerEmail;
		const bookingId = req.params.id;
		//try getting the driver email for future purposes
		driver = await Driver.findById(req.user.id).select('-password');
		if (!driver) {
			return res
				.status(500)
				.json({ errors: [{ msg: 'Unable to find the Driver!' }] });
		}
		//get the bookings of a driver
		bookings = await Bookings.findOne({ bookerEmail });
		let specificBooking;
		//check if bookings exist for the user
		if (bookings) {
			//get the specific booking which needs to be cancelled
			//and also remove that from the bookings document
			bookings.bookings = bookings.bookings.filter((value) => {
				if (
					value._id == bookingId &&
					value.status != 0 &&
					new Date(
						new Date().setDate(
							new Date(value.date.toLocaleDateString()).getDate() - 2
						)
					).getTime() >= new Date().getTime()
				)
					specificBooking = value;
				return value._id != bookingId;
			});
		}
		if (!specificBooking) {
			return res
				.status(400)
				.json({ errors: [{ msg: 'No such booking exists!' }] });
		}
		//save the document with updated bookings
		await bookings.save();
		//send mail to the appropriate user that booking has been cancelled
		result = await fn.sendCancellationMail(
			driver.name,
			bookerEmail,
			specificBooking.pickUp,
			specificBooking.drop,
			specificBooking.date,
			specificBooking.motive,
			specificBooking.startTime,
			'Driver',
			res
		);
		if (result >= 200 && result <= 300) msg = 'Email sent!';
		res.status(200).json({ cancellation: true, msg });
	} catch (err) {
		//prints the error message if it fails to delete the helper profile.
		res.status(500).json({ errors: [{ msg: err.message }] });
	}
});
// @route PUT api/drivers/bookingProposal
// @desc Respond to the request made by the user for a service;
// @access Public
router.put('/bookingProposal/:id/:accept', async (req, res) => {
	try {
		const jwtToken = req.params.id;
		expiredToken = await BlackList.findOne({ token: jwtToken });
		if (expiredToken)
			return res
				.status(400)
				.json({ errors: [{ msg: 'Link cannot be used again!' }] });
		const accept = req.params.accept;
		//verify the token fetched using secret Key
		const jwtObject = jwt.verify(jwtToken, config.get('jwtForBooking'));
		const bookingId = jwtObject.booking.id;
		const bookerEmail = jwtObject.booking.bookerEmail;
		//remove the booking request if drivers rejects it otherwise update the status and send the mail to booker in both cases
		//get the bookings for the booker
		bookings = await Bookings.findOne({ bookerEmail });
		let thisBooking;
		//if driver accepted the request
		if (accept == 'true') {
			bookings.bookings = bookings.bookings.map((value) => {
				if (String(value._id) == String(bookingId)) {
					thisBooking = value;
					value.status = 1;
				}
				return value;
			});
		}
		//if driver rejected the request
		else {
			bookings.bookings = bookings.bookings.filter((value) => {
				if (String(value._id) != String(bookingId)) {
					return true;
				} else {
					thisBooking = value;
				}
			});
		}
		//add the token to the blacklist as it cannot be used again
		blacklist = new BlackList({ token: jwtToken });
		await blacklist.save();
		await bookings.save();
		//send mail to the user accordingly
		let result;
		if (accept == 'true') {
			result = await fn.sendAcceptanceMail(
				thisBooking.driverName,
				bookerEmail,
				thisBooking.pickUp,
				thisBooking.drop,
				thisBooking.date,
				thisBooking.motive,
				thisBooking.startTime,
				'Driver',
				res
			);
		} else {
			result = await fn.sendRejectionMail(
				thisBooking.driverName,
				bookerEmail,
				thisBooking.pickUp,
				thisBooking.drop,
				thisBooking.date,
				thisBooking.motive,
				thisBooking.startTime,
				'Driver',
				res
			);
		}
		let msg;
		if (result >= 200 && result <= 300) msg = 'Email sent!';
		res.status(200).json({ accept, msg });
	} catch (err) {
		//prints the error message if it fails to delete the driver profile.
		res.status(500).json({ errors: [{ msg: err.message }] });
	}
});
// @route POST api/drivers/rate
// @desc RATE A SERVICE
// @access Public
router.post('/rate/:id/:rating', routeAuth, async (req, res) => {
	try {
		const bookingId = req.params.id;
		const bookerEmail = req.body.bookerEmail;
		const rating = Math.floor(Math.abs(req.params.rating));
		//get the bookings of a booker
		bookings = await Bookings.findOne({ bookerEmail });
		let bookerRated = false;
		//check if bookings exist for the user
		if (bookings) {
			//go through the bookings and update if not already rated and is not a future booking
			bookings.bookings = bookings.bookings.map((value) => {
				if (
					value._id == bookingId &&
					value.status != 0 &&
					value.date.getTime() < new Date().getTime() &&
					value.bookerRated != true
				) {
					value.bookerRated = true;
					bookerRated = true;
				}
				return value;
			});
			await bookings.save();
		}
		if (bookerRated) {
			//update the rating in the user profile or document
			booker = await Booker.findOne({ email: bookerEmail });

			console.log(rating, booker.rating);
			if (booker) {
				booker.numberOfServices = booker.numberOfServices + 1;
				booker.rating = Math.floor(
					((booker.numberOfServices - 1) * booker.rating + rating) /
						booker.numberOfServices
				);
				await booker.save();
			}

			return res.status(200).json({ bookerRated, msg: 'Rating updated!' });
		} else {
			return res.status(200).json({ bookerRated, msg: 'Unable to update!' });
		}
	} catch (err) {
		//prints the error message if it fails to delete the helper profile.
		res.status(500).json({ errors: [{ msg: err.message }] });
	}
});
module.exports = router;
