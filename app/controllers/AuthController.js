const redisClient = require('../common/redis').getClient();
const User = require("../models/User");
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");
const { sendMailToUser } = require("../common/mail");
const { generateOTP, containsWhitespace, containsSpecialCharacter, isValidEmail } = require('../common/utils');
const { OTP } = require('../constants');
class AuthController {
	async verifyOTP(req, res, next) {
		try {
			const { username, otp, typeOTP } = req.body;
			if (!username || !otp) {
				return res.status(400).json({
					message: "Please enter username and otp"
				})
			}
			if (!typeOTP) {
				typeOTP = OTP.RESET_PASS;
			}
			const cachedOTP = await redisClient.get(username);
			if (!cachedOTP) {
				return res.status(400).json({ message: "OTP has expired" });
			}
			if (cachedOTP == otp) {
				if (typeOTP == OTP.LOGIN) {
					const updatedUser = await User.findOneAndUpdate(
						{ username: username },
						{ verified: true },
						{ new: true }
					);
					if (updatedUser) {
						return res.status(200).json({ message: "Verified" });
					} else {
						return res.status(400).json({ message: "User not found" });
					}
				}
				return res.status(200).json({ message: "Verified", typeOTP: typeOTP });
			}
			return res.status(500).json({ message: "OTP is not match" });
		} catch (error) {
			return res.status(500).json({ error: error.message });
		}
	}
	async login(req, res, next) {
		try {
			const { username, password } = req.body;
			if (!username || !password) {
				return res.status(400).json({ message: "Please enter username and password" });
			}
			const user = await User.findOne({ username: username });
			if (!user) {
				return res.status(401).json({ error: "Incorrect username or password" });
			}

			const match = await bcrypt.compare(password, user.password);
			console.log(match);
			if (match) {

				// if (!user.verified) {
				// 	const otp = generateOTP();
				// 	await redisClient.setEx(username, 300, otp);
				// 	const subject = '[Duo Streaming] OTP verification';
				// 	const context = {
				// 		otp: otp,
				// 		message: 'Account Verification'
				// 	}
				// 	sendMailToUser(user.email, subject, 'sendOTP', context);
				// 	// return res.status(403).json({ error: 'Please check your email to continue' });
				// }

				const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
				return res.status(200).json({
					user: {
						userId: user._id,
						username: user.username
					},
					accessToken: token
				});
			} else {
				return res.status(401).json({ error: "Incorrect username or password" });
			}

		} catch (error) {
			return res.status(500).json({ error: error.message });
		}
	}
	async forgotPassword(req, res, next) {
		try {
			const { username } = req.body;
			if (!username) {
				return res.status(400).json({ message: "Invalid username" });
			}
			const user = await User.findOne({ username: username });
			if (!user) {
				return res.status(400).json({ error: "User not found" });
			}
			const subject = '[Duo Streaming] OTP verification forgot password';
			const otp = generateOTP();
			await redisClient.setEx(username, 300, otp);
			const context = {
				otp: otp,
				message: "Reset password"
			}
			sendMailToUser(user.email, subject, 'sendOTP', context);
			return res.status(200).json({ message: "Please check your email to continue" });
		} catch (error) {
			return res.status(500).json({ error: error.message });
		}
	}
	async resetPassword(req, res, next) {
		try {
			const { username, password, confirmPassword, otp } = req.body;
			if (!username || !password || !otp || !confirmPassword) {
				return res.status(400).json({
					error: 'Please enter username, password, confirm password, otp'
				});
			}
			if (password != confirmPassword) {
				return res.status(400).json({ error: "Confirm password is not match" });
			}
			const cachedOTP = await redisClient.get(username);
			if (!cachedOTP) {
				return res.status(400).json({ error: "OTP has expired" });
			}
			if (cachedOTP != otp) {
				return res.status(400).json({ error: "OTP is not match" });
			}
			const newPassword = await bcrypt.hash(password, 10);
			const updatedUser = await User.findOneAndUpdate(
				{ username: username },
				{ password: newPassword },
				{ new: true }
			);
			if (updatedUser) {
				return res.status(200).json({ message: "Reset Password successfully" });
			} else {
				return res.status(400).json({ error: "User not found" });
			}
		} catch (error) {
			return res.status(500).json({ error: error.message });
		}
	}

	async checkUsernameAvailable(req, res) {
		try {
			const { username } = req.body;
			const existingUser = await User.findOne({ username: username });
			if (existingUser) {
				return res.status(200).json({ available: false });
			} else {
				return res.status(200).json({ available: true });
			}
		} catch (error) {
			return res.status(500).json({ error: error.message });
		}
	}

	async checkEmailAvailable(req, res) {
		try {
			const { email } = req.body;
			const existingUser = await User.findOne({ email: email });
			if (existingUser) {
				return res.status(200).json({ available: false });
			} else {
				return res.status(200).json({ available: true });
			}
		} catch (error) {
			return res.status(500).json({ error: error.message });
		}
	}

	async sendVerifyEmail(req, res) {
		try {
			const { email } = req.body;
			const otp = generateOTP();
			await redisClient.setEx(email, 300, otp);
			const subject = '[Duo Streaming] OTP verification';
			const context = {
				otp: otp,
				message: 'Email Address Verification'
			}
			sendMailToUser(email, subject, 'sendOTP', context);
			return res.status(200).json({ message: "Please enter the OTP we send to your email to the registration form." })
		} catch (error) {
			return res.status(500).json({ error: error.message });
		}
	}

	async register(req, res) {
		try {
			const { username, fullname, password, email, otp } = req.body;

			if (!username) {
				return res.status(400).json({ error: "Required field 'username' is missing." });
			}
			if (containsWhitespace(username) || containsSpecialCharacter(username)) {
				return res.status(400).json({ error: "Username cannot contain spaces or special characters." });
			}
			if (!fullname) {
				return res.status(400).json({ error: "Required field 'fullname' is missing." });
			}
			if (!password) {
				return res.status(400).json({ error: "Required field 'password' is missing." });
			}
			if (!email) {
				return res.status(400).json({ error: "Required field 'email' is missing." });
			}
			if (!isValidEmail(email)) {
				return res.status(400).json({ error: "Invalid email address." });
			}
			if (!otp) {
				return res.status(400).json({ error: "Required field 'otp' is missing." });
			}
			const cachedOTP = await redisClient.get(email);
			if (!cachedOTP) {
				return res.status(400).json({ error: "OTP has expired." });
			}
			if (cachedOTP != otp) {
				return res.status(400).json({ error: "OTP is not match." });
			}

			const existingUser = await User.findOne({ username: username });
			if (existingUser) {
				return res.status(400).json({ error: "This username is unavailable." });
			}
			const existingEmail = await User.findOne({ email: email });
			if (existingEmail) {
				return res.status(400).json({ error: "This email is unavailable." });
			}
			const hash = await bcrypt.hash(password, 10);
			const newUser = new User({
				username: username,
				fullname: fullname,
				password: hash,
				email: email
			});
			const savedUser = await newUser.save();
			// login
			const token = jwt.sign({ userId: savedUser._id }, process.env.JWT_SECRET);

			return res.status(201).json({
				message: "Register successfully.",
				user: {
					userId: savedUser._id,
					username: savedUser.username
				},
				accessToken: token
			});
		} catch (error) {
			return res.status(500).json({ error: error.message });
		}
	}

	async changePassword(req, res) {
		try {
			const userId = req.user.userId;
			const { oldPassword, newPassword } = req.body;
			if (!oldPassword || !newPassword) {
				return res.status(400).json({
					error: "Please enter old password and new password."
				});
			}
			const user = await User.findById(userId);
			if (!user) {
				return res.status(400).json({ error: "User not found." })
			}
			const match = await bcrypt.compare(oldPassword, user.password);
			if (match) {
				const newHashPassword = await bcrypt.hash(newPassword, 10);
				user.password = newHashPassword;
				await user.save();
				// const updatedUser = await User.findByIdAndUpdate(
				// 	userId,
				// 	{ password: newHashPassword },
				// 	{ new: true }
				// );
				return res.status(200).json({ message: "Change password successfully." })
			} else {
				return res.status(400).json({ error: "Your current password was incorrect." })
			}
		} catch (error) {
			return res.status(500).json({ error: error.message });
		}
	}

	async changeUsername(req, res) {
		try {
			const userId = req.user.userId;
			const { username, password } = req.body;
			if (!username || !password) {
				return res.status(400).json({
					error: "Please enter password and new username."
				});
			}
			const user = await User.findById(userId);
			if (!user) {
				return res.status(400).json({ error: "User not found." });
			}
			// Check if 14 days from last time change username
			const today = new Date();
			if (today.getDate() - user.lastChangeUsername.getDate() < 14) {
				return res.status(403).json({ error: "Username can only change once every 14 days." })
			}
			const match = await bcrypt.compare(password, user.password);
			if (match) {
				user.username = username;
				await user.save();
				return res.status(200).json({ 
					message: "Change username successfully.",
					newUsername: user.username
				})
			} else {
				return res.status(400).json({ error: "Your password was incorrect." })
			}
		} catch (error) {
			return res.status(500).json({ error: error.message });
		}
	}

	async changeEmail(req, res) {
		try {
			const userId = req.user.userId;
			const { email, otp } = req.body;
			if (!email) {
				return res.status(400).json({ error: "Please enter new email address." });
			}
			if (!isValidEmail(email)) {
				return res.status(400).json({ error: "Invalid email address." });
			}
			if (!otp) {
				return res.status(400).json({ error: "Required field 'otp' is missing." });
			}
			const cachedOTP = await redisClient.get(email);
			if (!cachedOTP) {
				return res.status(400).json({ error: "OTP has expired." });
			}
			if (cachedOTP != otp) {
				return res.status(400).json({ error: "OTP is not match." });
			}
			const user = await User.findById(userId);
			if (!user) {
				return res.status(400).json({ error: "User not found." })
			}
			user.email = email;
			await user.save();
			return res.status(200).json({
				newEmail: user.email,
				message: "Change email address successfully. Please verify your new email address."
			})
		} catch (error) {
			return res.status(500).json({ error: error.message });
		}
	}
}

module.exports = new AuthController();