const redisClient = require('../common/redis').getClient();
const User = require("../models/User");
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");
const { sendMailToUser } = require("../common/mail");
const { generateOTP } = require('../common/utils');
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
			if (!user.verified) {
				const otp = generateOTP();
				await redisClient.setEx(username, 300, otp);
				const subject = '[Duo Streaming] OTP verification';
				const context = {
					otp: otp,
					message: 'Account Verification'
				}
				sendMailToUser(user, subject, 'sendOTP', context);
				return res.status(403).json({ error: 'Please check your email to continue' });
			}
			const match = await bcrypt.compare(password, user.password);
			if (match) {
				const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
				res.cookie('access-token', token, { maxAge: 60 * 60 * 1000, httpOnly: false });
				return res.status(200).json({ success: 'Login successfully' });
			} else {
				return res.status(401).json({ message: "Invalid email or password" });
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
}

module.exports = new AuthController();