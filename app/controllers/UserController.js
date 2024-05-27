const redisClient = require('../common/redis').getClient();
const User = require("../models/User");
class UserController {
	async follow(req, res, next) {
		try {
			const { followId } = req.body;
			if(!followId) {
				return res.status(400).json({ message: 'Please enter followId' });
			}
			const userId = req.user.userId; 
			const updatedUser = await User.findByIdAndUpdate(
				userId,
				{ $push: { follows: { user_id: followId } } },
				{ new: true }
			);

			if (!updatedUser) {
				return res.status(400).json({ message: "User not found" });
			}

			return res.status(200).json({ message: "Followed successfully", user: updatedUser });
		} catch (error) {
			return res.status(500).json({ error: error.message });
		}
	}
}

module.exports = new UserController();