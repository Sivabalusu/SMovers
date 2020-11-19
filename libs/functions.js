const jwt = require('jsonwebtoken');
const config = require('config');
const BlackList = require('../models/BlackList');
const Availability = require('../models/Availability');
const sgMail = require('@sendgrid/mail');
const { Bookings } = require('../models/Booking');
//@desc Add any functions separated from API routes

module.exports = {
	//method to create jwt for protected routes using id passed to it
	createJwtToken: function (payload, res) {
		jwt.sign(
			payload,
			config.get('jwtKey'),
			{
				expiresIn: 3600,
			},
			(err, token) => {
				if (err) throw err;
				res.json({ token });
			}
		);
	},
	//method to invalidate a token when user logs out of the system
	logout: async function (req, res) {
		const token = req.header('x-auth-token');
		//check if token exists in the header
		if (token) {
			//check if the token is already in the blacklist, when user tries to access logout directly
			const valid = await BlackList.findOne({ token });
			if (valid) {
				return res
					.status(200)
					.json({ logout: true, msg: 'Token already invalidated!' });
			}
			//else add the token to the blacklist
			const blackList = new BlackList({ token });
			blackList.save();

			res.status(200).json({ logout: true, msg: 'Token invalidated!' });
		} else {
			//if token is not provided
			res
				.status(400)
				.json({ errors: [{ logout: true, msg: 'Invalid request!' }] });
		}
	},
	//method to get the availabilities of the secondary users -> helpers and drivers
	getAvailabilities: async function (req, res) {
		const { date } = req.query;
		//get the last Sunday's date -> AS driver and helper will be able to give availability for next 7 days, starting Sunday
		//if no date is provided take current date!

		const chosenDate =
			date == null || typeof date == undefined || date.trim().length == 0
				? new Date()
				: new Date(
						date.split('-')[0],
						date.split('-')[1] - 1,
						date.split('-')[2]
				  );
		chosenDate.setHours(0, 0, 0, 0);
		let currentDate = new Date();
		currentDate.setHours(0, 0, 0, 0);
		//date cannot be in past
		if (chosenDate.getTime() >= currentDate.getTime()) {
			const currentDay = chosenDate.getDay();
			//convert UTC to local EST and get the date
			const lastSunday = new Date(
				new Date().setDate(chosenDate.getDate() - currentDay)
			).toLocaleDateString();
			//now get all the avaliabilities
			let availableEmails = [];
			let availabilities = await Availability.find();

			availabilities = availabilities.filter((availability) => {
				//store the emails of the available drivers and helpers
				if (availability.dateUpdated.toLocaleDateString() == lastSunday) {
					availableEmails.push(availability.email);
				}
				return availability.dateUpdated.toLocaleDateString() == lastSunday;
			});
			return [availabilities, availableEmails];
		}
		return;
	},
	//get availability and users' details combined
	getUsersWithAvaliability: function (availabilities, availableUsers) {
		return availableUsers.map((availableUser) => {
			return availabilities
				.filter((availability) => {
					return availableUser.email == availability.email;
				})
				.map((availability) => {
					if (availableUser.email == availability.email) {
						availableUserDoc = { ...availableUser._doc };
						availabilityDoc = { ...availability._doc };
						//spread and combine the objects
						return { ...availabilityDoc, ...availableUserDoc };
					}
				});
		});
	},
	updateOrCreateAvailability: async (availability, user) => {
		const newAvailability = {
			email: user.email,
			dateUpdated: new Date().toLocaleDateString(),
		};
		newAvailability.availability = availability.map(
			(availability) => availability
		);
		//update the availability if exists or create new one
		return await Availability.findOneAndUpdate(
			{ email: user.email },
			newAvailability,
			{ upsert: true, new: true }
		);
	},
	//method to create jwt for forgot password
	createForgotToken: async (payload, res) => {
		try {
			const token = jwt.sign(payload, config.get('jwtForgotPassword'), {
				expiresIn: 900,
			});
			return token;
		} catch (err) {
			res.status(500).json({ errors: [{ msg: err.message }] });
		}
	},

	sendMail: async (to, subject, html, res) => {
		sgMail.setApiKey(config.get('SENDGRID_API_KEY'));
		const msg = {
			to, // Change to your recipient
			from: 'tarunpreetsingh16@gmail.com', // Change to your verified sender
			subject,
			html,
		};

		try {
			result = await sgMail.send(msg);
			if (result) {
				return result[0].statusCode;
			}
		} catch (error) {
			console.log(error.message);
		}
	},

	//method to create jwt for booking
	createBookingToken: async (payload, res) => {
		try {
			const token = jwt.sign(payload, config.get('jwtForBooking'), {
				expiresIn: 1800,
			});
			return token;
		} catch (err) {
			res.status(500).json({ errors: [{ msg: err.message }] });
		}
	},
	//check status of a booking
	checkStatus: async function (bookerEmail, bookingId) {
		try {
			bookings = await Bookings.findOne({ bookerEmail });
			var specificBooking;
			if (bookings) {
				specificBooking = bookings.bookings.filter((value) => {
					return String(value._id) == String(bookingId);
				});
			}
			return specificBooking[0].status;
		} catch (err) {
			console.log(err.message);
		}
	},
	customSetTimeout: async function (timeMS) {
		const promise = new Promise((resolve, reject) => {
			setTimeout(resolve, timeMS);
		});
		return promise;
	},
	sendRequestMail: async function (
		token,
		email,
		booker,
		pickUp,
		drop,
		date,
		motive,
		startTime,
		typeOfUser,
		res
	) {
		const acceptanceLink = `http://localhost:5000/api/${typeOfUser}/bookingProposal/${token}/true`;
		const rejectionLink = `http://localhost:5000/api/${typeOfUser}/bookingProposal/${token}/false`;
		const message = `
      <div style="font-family: sans-serif">
      <h2 style="font-size: 1rem;">Hi,</h2>
      <h2 style="font-size: 1rem;">You have been requested for a service. Details are provided below -  </h2>
      <pre style="font-size: 1rem">
      Booker Name - ${booker.name}
      Pick Up Address - ${pickUp.number} ${pickUp.street}, ${pickUp.city}, ${pickUp.province}, ${pickUp.zipCode}, ${pickUp.country}
      Drop Address - ${drop.number} ${drop.street}, ${drop.city}, ${drop.province}, ${drop.zipCode}, ${drop.country}
      Date - ${date}
      Start Time - ${startTime}
      Motive - ${motive}
      </pre>
      <h2 style="font-size: 1rem;">If interested respond within 5 minutes or request will be cancelled <strong><em>automatically!</em></strong></h2>
      <div style="display: flex">
          <a href=${acceptanceLink}>
              <button style="padding:1px 5px; background-color:orange;border-radius:5px;border:0;color:white;font-size: 1rem">Accept</button>
          </a>
          <a href="${rejectionLink}">
              <button style=" margin:auto 5px;padding:1px 5px; background-color:red;border-radius:5px;border:0;color:white;font-size: 1rem">Reject</button>
          </a>
      </div>
    </div>
    `;
		const to = email;
		const subject = 'Booking request - S_MOVERS';
		result = await module.exports.sendMail(to, subject, message, res);
		if (result >= 200 && result <= 300)
			res.status(200).json({ msg: 'Email has been sent!' });
	},
	//send automatic cancellation of the service mail to the user
	sendAutomaticMail: async function (
		token,
		fromEmail,
		booker,
		pickUp,
		drop,
		date,
		motive,
		startTime,
		typeOfUser,
		res
	) {
		const message = `
      <div style="font-family: sans-serif">
      <h2 style="font-size: 1rem;">Hi ${booker.name},</h2>
      <h2 style="font-size: 1rem;">You tried requesting for a service. Details are provided below -  </h2>
      <pre style="font-size: 1rem">
      ${typeOfUser} Email - ${fromEmail}
      Pick Up Address - ${pickUp.number} ${pickUp.street}, ${pickUp.city}, ${pickUp.province}, ${pickUp.zipCode}, ${pickUp.country}
      Drop Address - ${drop.number} ${drop.street}, ${drop.city}, ${drop.province}, ${drop.zipCode}, ${drop.country}
      Date - ${date}
      Start Time - ${startTime}
      Motive - ${motive}
      </pre>
      <h2 style="font-size: 1rem;">Unfortunately, ${typeOfUser} did not respond to the request. You can try booking same or another ${typeOfUser} again. We apologize for the incovenience.</h2>
    </div>
    `;
		const to = booker.email;
		const subject = 'Booking cancellation - S_MOVERS';
		result = await module.exports.sendMail(to, subject, message, res);
	},
	sendAcceptanceMail: async function (
		fromEmail,
		bookerEmail,
		pickUp,
		drop,
		date,
		motive,
		startTime,
		typeOfUser,
		res
	) {
		const message = `
    <div style="font-family: sans-serif">
    <h2 style="font-size: 1rem;">Hi ${booker.name},</h2>
    <h2 style="font-size: 1rem;">You tried requesting for a service. Details are provided below -  </h2>
    <pre style="font-size: 1rem">
    ${typeOfUser} Name - ${fromEmail}
    Pick Up Address - ${pickUp.number} ${pickUp.street}, ${pickUp.city}, ${pickUp.province}, ${pickUp.zipCode}, ${pickUp.country}
    Drop Address - ${drop.number} ${drop.street}, ${drop.city}, ${drop.province}, ${drop.zipCode}, ${drop.country}
    Date - ${date}
    Start Time - ${startTime}
    Motive - ${motive}
    </pre>
    <h2 style="font-size: 1rem;">Your request has been accepted by the ${typeOfUser}. You can see the booking in your account. Thank you for choosing S_Movers.</h2>
  </div>
  `;
		const to = bookerEmail;
		const subject = 'Booking acceptance - S_MOVERS';
		return await module.exports.sendMail(to, subject, message, res);
	},
	sendRejectionMail: async function (
		fromEmail,
		bookerEmail,
		pickUp,
		drop,
		date,
		motive,
		startTime,
		typeOfUser,
		res
	) {
		const message = `
    <div style="font-family: sans-serif">
    <h2 style="font-size: 1rem;">Hi ${booker.name},</h2>
    <h2 style="font-size: 1rem;">You tried requesting for a service. Details are provided below -  </h2>
    <pre style="font-size: 1rem">
    ${typeOfUser} Name - ${fromEmail}
    Pick Up Address - ${pickUp.number} ${pickUp.street}, ${pickUp.city}, ${pickUp.province}, ${pickUp.zipCode}, ${pickUp.country}
    Drop Address - ${drop.number} ${drop.street}, ${drop.city}, ${drop.province}, ${drop.zipCode}, ${drop.country}
    Date - ${date}
    Start Time - ${startTime}
    Motive - ${motive}
    </pre>
    <h2 style="font-size: 1rem;">Unfortunately, ${typeOfUser} rejected the request. You can try booking same or another ${typeOfUser} again. We apologize for the incovenience.</h2>
  </div>
  `;
		const to = bookerEmail;
		const subject = 'Booking rejection - S_MOVERS';
		return await module.exports.sendMail(to, subject, message, res);
	},
	//send automatic cancellation of the service mail to the user
	sendCancellationMail: async function (
		fromName,
		toEmail,
		pickUp,
		drop,
		date,
		motive,
		startTime,
		typeOfUser,
		res
	) {
		const message = `
      <div style="font-family: sans-serif">
      <h2 style="font-size: 1rem;">Hi,</h2>
      <h2 style="font-size: 1rem;">The booking with the following details has been <strong><em>cancelled</em></strong> by the ${typeOfUser} -   </h2>
      <pre style="font-size: 1rem">
      ${typeOfUser} Name - ${fromName}
      Pick Up Address - ${pickUp.number} ${pickUp.street}, ${pickUp.city}, ${pickUp.province}, ${pickUp.zipCode}, ${pickUp.country}
      Drop Address - ${drop.number} ${drop.street}, ${drop.city}, ${drop.province}, ${drop.zipCode}, ${drop.country}
      Date - ${date}
      Start Time - ${startTime}
      Motive - ${motive}
      </pre>
      <h2 style="font-size: 1rem;">We apologize for the incovenience please adjust accordingly.</h2>
    </div>
    `;
		const to = toEmail;
		const subject = 'Booking cancellation - S_MOVERS';
		result = await module.exports.sendMail(to, subject, message, res);
		return result;
	},
};
