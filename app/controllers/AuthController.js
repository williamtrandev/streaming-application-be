const jwt = require("jsonwebtoken");
const bcrypt = require('bcryptjs');
const User = require("../models/User");

class AuthController {
	home(req, res, next) {
		return res.status(200).json({ hi: "HI" });
	}

	async checkUsernameAvailable(req, res) {
		const { username } = req.body;
		const existingUser = await User.findOne({ username: username });
        if (existingUser) {
            return res.status(400).json({ message: "This username is unavailable." });
        } else {
			return res.status(200).json({ message: "This username is available." });
		}
	}

	async checkEmailAvailable(req, res) {
		const { email } = req.body;
		const existingUser = await User.findOne({ email: email });
        if (existingUser) {
            return res.status(400).json({ message: "This email is unavailable." });
        } else {
			return res.status(200).json({ message: "This email is available." });
		}
	}

	async register(req, res) {
		const { username, fullname, password, email } = req.body;

		if (!username) {
			return res.status(400).json({ message: "Required field 'username' is missing." });
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
		
		const existingUser = await User.findOne({ username: username });
		const existingEmail = await User.findOne({ email: email });
        if (existingUser) {
            return res.status(400).json({ message: "This username is unavailable." });
        }
		if (existingEmail) {
            return res.status(400).json({ message: "This email is unavailable." });
        }
		const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);
		const newUser = new User({
			username: username,
			fullname: fullname,
			password: hash,
			email: email
		});
		const savedUser = await newUser.save();
		return res.status(201).json({ message: "Register successfully." });
	}
}

module.exports = new AuthController;