const redisClient = require('../common/redis').getClient();
const User = require("../models/User");
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");
const { sendMailToUser } = require("../common/mail");
const { generateOTP, containsWhitespace, isValidEmail } = require('../common/utils');
const { OTP } = require('../constants');
class AuthController {
	async verifyOTP(req, res, next) {
		try {
			var { username, otp, typeOTP } = req.body;
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
				return res.status(401).json({ error: 'Invalid email or password' });
			}

			const match = await bcrypt.compare(password, user.password);
			if (match) {

				if (!user.verified) {
					const otp = generateOTP();
					await redisClient.setEx(username, 300, otp);
					const subject = '[Duo Streaming] OTP verification';
					const context = {
						otp: otp,
						message: 'Account Verification'
					}
					sendMailToUser(user, subject, 'sendOTP', context);
					// return res.status(403).json({ error: 'Please check your email to continue' });
				}

				const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
				return res.status(200).json({ 
					user: {
						userId: user._id,
						username: user.username,
						fullname: user.fullname,
						verified: user.verified
					},
					accessToken: token
				});
			} else {
				return res.status(401).json({ message: "Incorrect username or password" });
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
				return res.status(400).json({ message: "User not found" });
			}
			const subject = '[Duo Streaming] OTP verification forgot password';
			const otp = generateOTP();
			await redisClient.setEx(username, 300, otp);
			const context = {
				otp: otp,
				message: "Reset password"
			}
			sendMailToUser(user, subject, 'sendOTP', context);
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
					message: 'Please enter username, password, confirm password, otp'
				});
			}
			if (password != confirmPassword) {
				return res.status(400).json({ message: "Confirm password is not match" });
			}
			const cachedOTP = await redisClient.get(username);
			if (!cachedOTP) {
				return res.status(400).json({ message: "OTP has expired" });
			}
			if (cachedOTP != otp) {
				return res.status(400).json({ message: "OTP is not match" });
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
				return res.status(400).json({ message: "User not found" });
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
				return res.status(400).json({ message: "This username is unavailable." });
			} else {
				return res.status(200).json({ message: "This username is available." });
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
				return res.status(400).json({ message: "This email is unavailable." });
			} else {
				return res.status(200).json({ message: "This email is available." });
			}
		} catch (error) {
			return res.status(500).json({ error: error.message });
		}
	}

	async register(req, res) {
		try {
			const { username, fullname, password, email } = req.body;

			if (!username) {
				return res.status(400).json({ message: "Required field 'username' is missing." });
			}
			if (containsWhitespace(username)) {
				return res.status(400).json({ message: "Username don't contain white space." });
			}
			if (!fullname) {
				return res.status(400).json({ message: "Required field 'fullname' is missing." });
			}
			if (!password) {
				return res.status(400).json({ message: "Required field 'password' is missing." });
			}
			if (!email) {
				return res.status(400).json({ message: "Required field 'email' is missing." });
			}
			if (!isValidEmail(email)) {
				return res.status(400).json({ message: "Invalid email address." });
			}

			const existingUser = await User.findOne({ username: username });
			if (existingUser) {
				return res.status(400).json({ message: "This username is unavailable." });
			}
			const existingEmail = await User.findOne({ email: email });
			if (existingEmail) {
				return res.status(400).json({ message: "This email is unavailable." });
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
			// verify email address
			const otp = generateOTP();
			await redisClient.setEx(username, 300, otp);
			const subject = '[Duo Streaming] OTP verification';
			const context = {
				otp: otp,
				message: 'Account Verification'
			}
			sendMailToUser(savedUser, subject, 'sendOTP', context);

			return res.status(201).json({
				message: "Register successfully. Please verify your email address.",
				token: token,
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
					message: "Please enter old password and new password."
				});
			}
			const user = await User.findById(userId);
			if (!user) {
				return res.status(400).json({ message: "User not found." })
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
				return res.status(400).json({ message: "Your current password was incorrect." })
			}
		} catch (error) {
			return res.status(500).json({ error: error.message });
		}
	}

	async changeUsername(req, res) {
		try {
			const userId = req.user.userId;
			const { newUsername, password } = req.body;
			if (!newUsername || !password) {
				return res.status(400).json({
					message: "Please enter password and new username."
				});
			}
			const user = await User.findById(userId);
			if (!user) {
				return res.status(400).json({ message: "User not found." })
			}
			const match = await bcrypt.compare(password, user.password);
			if (match) {
				user.username = newUsername;
				await user.save();
				return res.status(200).json({ message: "Change username successfully." })
			} else {
				return res.status(400).json({ message: "Your password was incorrect." })
			}
		} catch (error) {
			return res.status(500).json({ error: error.message });
		}
	}

	async changeEmail(req, res) {
		try {
			const userId = req.user.userId;
			const { newEmail } = req.body;
			if (!newEmail) {
				return res.status(400).json({ message: "Please enter new email address." });
			}
			if (!isValidEmail(newEmail)) {
				return res.status(400).json({ message: "Invalid email address." });
			}
			const user = await User.findById(userId);
			if (!user) {
				return res.status(400).json({ message: "User not found." })
			}
			user.email = newEmail;
			user.verified = false;
			// verify new email
			const username = user.username;
			const otp = generateOTP();
			await redisClient.setEx(username, 300, otp);
			const subject = '[Duo Streaming] OTP verification';
			const context = {
				otp: otp,
				message: 'New Email Address Verification'
			}
			sendMailToUser(user, subject, 'sendOTP', context);
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