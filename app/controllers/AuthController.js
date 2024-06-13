import redisClient from '../common/redis.js';
import User from "../models/User.js";
import bcrypt from 'bcrypt';
import jwt from "jsonwebtoken";
import { sendMailToUser } from "../common/mail.js";
import { generateOTP, containsWhitespace, containsSpecialCharacter, isValidEmail } from '../common/utils.js';
import { OTP } from '../constants/index.js';

class AuthController {
	// async verifyOTP(req, res, next) {
	// 	try {
	// 		var { username, otp, typeOTP } = req.body;
	// 		if (!username || !otp) {
	// 			return res.status(400).json({
	// 				message: "Please enter username and otp"
	// 			});
	// 		}
	// 		if (!typeOTP) {
	// 			typeOTP = OTP.RESET_PASS;
	// 		}
	// 		const cachedOTP = await redisClient.getInstance().get(username);
	// 		if (!cachedOTP) {
	// 			return res.status(400).json({ message: "OTP has expired" });
	// 		}
	// 		if (cachedOTP == otp) {
	// 			if (typeOTP == OTP.LOGIN) {
	// 				const updatedUser = await User.findOneAndUpdate(
	// 					{ username: username },
	// 					{ verified: true },
	// 					{ new: true }
	// 				);
	// 				if (updatedUser) {
	// 					return res.status(200).json({ message: "Verified" });
	// 				} else {
	// 					return res.status(400).json({ message: "User not found" });
	// 				}
	// 			}
	// 			return res.status(200).json({ message: "Verified", typeOTP: typeOTP });
	// 		}
	// 		return res.status(500).json({ message: "OTP is not match" });
	// 	} catch (error) {
	// 		return res.status(500).json({ message: error.message });
	// 	}
	// }

	async login(req, res, next) {
		try {
			const { username, password } = req.body;
			if (!username || !password) {
				return res.status(400).json({ message: "Please enter username and password" });
			}
			const user = await User.findOne({ username: username }).lean();
			if (!user) {
				return res.status(401).json({ message: "Incorrect username or password" });
			}
			const match = await bcrypt.compare(password, user.password);
			console.log(match);
			if (match) {
				// if (!user.verified) {
				// 	const otp = generateOTP();
				// 	await redisClient.getInstance().setEx(username, 300, otp);
				// 	const subject = '[Duo Streaming] OTP verification';
				// 	const context = {
				// 		otp: otp,
				// 		message: 'Account Verification'
				// 	};
				// 	sendMailToUser(user, subject, 'sendOTP', context);
				// 	// return res.status(403).json({ error: 'Please check your email to continue' });
				// }

				const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
				const { password: pwd, ...userWithoutPassword } = user;

				return res.status(200).json({
					user: userWithoutPassword,
					accessToken: token
				});
			} else {
				return res.status(401).json({ message: "Incorrect username or password" });
			}
		} catch (error) {
			return res.status(500).json({ message: error.message });
		}
	}

	async forgotPassword(req, res, next) {
		try {
			const { email, username } = req.body;
			if (!email || !username) {
				return res.status(400).json({ message: "Please enter email and username" });
			}
			const user = await User.findOne({ email: email, username: username });
			if (!user) {
				return res.status(400).json({ message: "Email and Username match with no account" });
			}
			const subject = '[Duo Streaming] OTP verification forgot password';
			const otp = generateOTP();
			await redisClient.getInstance().setEx(email, 300, otp);
			const context = {
				otp: otp,
				message: "Reset password"
			};
			sendMailToUser(user.email, subject, 'sendOTP', context);
			return res.status(200).json({ message: "Please check your email to continue" });
		} catch (error) {
			return res.status(500).json({ message: error.message });
		}
	}

	async resetPassword(req, res, next) {
		try {
			const { email, password, confirmPassword, otp } = req.body;
			if (!email || !password || !otp || !confirmPassword) {
				return res.status(400).json({
					message: 'Please enter email, password, confirm password, otp'
				});
			}
			if (password != confirmPassword) {
				return res.status(400).json({ message: "Confirm password is not match" });
			}
			const cachedOTP = await redisClient.getInstance().get(email);
			if (!cachedOTP) {
				return res.status(400).json({ message: "OTP has expired" });
			}
			if (cachedOTP != otp) {
				return res.status(400).json({ message: "OTP is not match" });
			}
			const newPassword = await bcrypt.hash(password, 10);
			const updatedUser = await User.findOneAndUpdate(
				{ email: email },
				{ password: newPassword },
				{ new: true }
			);
			if (updatedUser) {
				return res.status(200).json({ message: "Reset Password successfully" });
			} else {
				return res.status(400).json({ message: "User not found" });
			}
		} catch (error) {
			return res.status(500).json({ message: error.message });
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
			return res.status(500).json({ message: error.message });
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
			return res.status(500).json({ message: error.message });
		}
	}

	async sendVerifyEmail(req, res) {
		try {
			const { email } = req.body;
			const otp = generateOTP();
			await redisClient.getInstance().setEx(email, 300, otp);
			const subject = '[Duo Streaming] OTP verification';
			const context = {
				otp: otp,
				message: 'Email Address Verification'
			}
			sendMailToUser(email, subject, 'sendOTP', context);
			return res.status(200).json({ message: "Please enter the OTP we send to your email to the form" });
		} catch (error) {
			return res.status(500).json({ message: error.message });
		}
	}

	async register(req, res) {
		try {
			const { username, fullname, password, email, otp } = req.body;

			if (!username) {
				return res.status(400).json({ message: "Required field 'username' is missing" });
			}
			if (containsWhitespace(username) || containsSpecialCharacter(username)) {
				return res.status(400).json({ message: "Username cannot contain spaces or special characters" });
			}
			if (!fullname) {
				return res.status(400).json({ message: "Required field 'fullname' is missing" });
			}
			if (!password) {
				return res.status(400).json({ message: "Required field 'password' is missing" });
			}
			if (!email) {
				return res.status(400).json({ message: "Required field 'email' is missing" });
			}
			if (!isValidEmail(email)) {
				return res.status(400).json({ message: "Invalid email address" });
			}
			if (!otp) {
				return res.status(400).json({ message: "Required field 'otp' is missing" });
			}
			const cachedOTP = await redisClient.getInstance().get(email);
			if (!cachedOTP) {
				return res.status(400).json({ message: "OTP has expired" });
			}
			if (cachedOTP != otp) {
				return res.status(400).json({ message: "OTP is not match" });
			}

			const existingUser = await User.findOne({ username: username });
			if (existingUser) {
				return res.status(400).json({ message: "This username is unavailable" });
			}
			const existingEmail = await User.findOne({ email: email });
			if (existingEmail) {
				return res.status(400).json({ message: "This email is unavailable" });
			}
			const hash = await bcrypt.hash(password, 10);
			const newUser = new User({
				username: username,
				fullname: fullname,
				password: hash,
				email: email,
				profilePicture: {
					publicId: process.env.DEFAULT_PROFILE_PICTURE_PUBLIC_ID,
					url: process.env.DEFAULT_PROFILE_PICTURE_URL
				},
				profileBanner: {
					publicId: process.env.DEFAULT_PROFILE_BANNER_PUBLIC_ID,
					url: process.env.DEFAULT_PROFILE_BANNER_URL
				}
			});
			const savedUser = await newUser.save();
			// login
			const token = jwt.sign({ userId: savedUser._id }, process.env.JWT_SECRET);

			return res.status(201).json({
				message: "Register successfully",
				user: {
					_id: savedUser._id,
					username: savedUser.username
				},
				accessToken: token
			});
		} catch (error) {
			return res.status(500).json({ message: error.message });
		}
	}

	async changePassword(req, res) {
		try {
			const userId = req.user.userId;
			const { oldPassword, newPassword } = req.body;
			if (!oldPassword || !newPassword) {
				return res.status(400).json({
					message: "Please enter old password and new password"
				});
			}
			const user = await User.findById(userId);
			if (!user) {
				return res.status(400).json({ message: "User not found" });
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
				return res.status(200).json({ message: "Change password successfully" });
			} else {
				return res.status(400).json({ message: "Your current password was incorrect" });
			}
		} catch (error) {
			return res.status(500).json({ message: error.message });
		}
	}

	async changeUsername(req, res) {
		try {
			const userId = req.user.userId;
			const { username, password } = req.body;
			if (!username || !password) {
				return res.status(400).json({
					message: "Please enter password and new username"
				});
			}
			const user = await User.findById(userId);
			if (!user) {
				return res.status(400).json({ message: "User not found" });
			}
			// Check if 14 days from last time change username
			const today = new Date();
			if (today.getDate() - user.lastChangeUsername.getDate() < 14) {
				return res.status(403).json({ message: "Username can only change once every 14 days" })
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
				return res.status(400).json({ message: "Your password was incorrect" });
			}
		} catch (error) {
			return res.status(500).json({ message: error.message });
		}
	}

	async changeEmail(req, res) {
		try {
			const userId = req.user.userId;
			const { email, otp } = req.body;
			if (!email) {
				return res.status(400).json({ message: "Please enter new email address" });
			}
			if (!isValidEmail(email)) {
				return res.status(400).json({ message: "Invalid email address" });
			}
			if (!otp) {
				return res.status(400).json({ message: "Required field 'otp' is missing" });
			}
			const cachedOTP = await redisClient.getInstance().get(email);
			if (!cachedOTP) {
				return res.status(400).json({ message: "OTP has expired" });
			}
			if (cachedOTP != otp) {
				return res.status(400).json({ message: "OTP is not match" });
			}
			const user = await User.findById(userId);
			if (!user) {
				return res.status(400).json({ message: "User not found" });
			}
			user.email = email;
			await user.save();
			return res.status(200).json({
				newEmail: user.email,
				message: "Change email address successfully"
			});
		} catch (error) {
			return res.status(500).json({ message: error.message });
		}
	}

	async forgotUsername(req, res) {
        try {
            const { email } = req.body;
			if (!email) {
				return res.status(400).json({ message: "Please enter your email address" });
			}
            const user = await User.findOne({ email: email });
            if (!user) {
                return res.status(400).json({ message: "User not found" });
            }
			const subject = '[Duo Streaming] Your username';
			const context = {
				username: user.username,
				message: 'This is your username'
			}
			sendMailToUser(email, subject, 'forgotUsername', context);
			return res.status(200).json({ message: "We have sent you an email containing your username. Please check your email." });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }
}

export default new AuthController();
