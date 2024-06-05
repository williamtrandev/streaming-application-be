const Stream = require("../models/Stream");
const Notification = require("../models/Notification");
const Follower = require("../models/Follower");

class StudioController {
	async saveStream(req, res) {
		try {
			const { userId, title, description, dateStream, tags } = req.body;
			if (!userId || !title || !description || !dateStream) {
				return res.status(400).json({ message: "Please enter userId, title, description, dateStream" });
			}
			const data = await Stream.create({
				user: userId,
				title: title,
				description: description,
				dateStream: dateStream,
				tags: tags
			});
			if (!data) {
				return res.status(500).json({ message: "Failed to create stream" });
			}
			return res.status(201).json({ 
				message: "Create stream successfully",
				stream: data
			});
		} catch (error) {
			return res.status(500).json({ error: error.message });
		}
	}
	async saveNotification(req, res, next) {
		try {
			const { userId, content } = req.body;
			if (!userId || !content) {
				return res.status(400).json({ message: "Please enter userId, content" });
			}
			const followers = await Follower.find({ follower: userId, receiveNotification: true });
			const notifications = followers.map(follower => ({
				user: follower.user,
				content: content
			}));

			const createdNotifications = await Notification.insertMany(notifications);

			if (!createdNotifications) {
				return res.status(500).json({ message: "Failed to create notifications" });
			}

			return res.status(200).json({
				message: "Create notifications successfully"
			});
		} catch (error) {
			return res.status(500).json({ error: error.message });
		}
	}
	async getNotification(req, res, next) {
		try {
			const userId = req.user.userId;
			if (!userId) {
				return res.status(400).json({ message: "Please login" });
			}
			const notifications = await Notification.find({ user: userId })
				.sort({ createdAt: -1 }) 
				.limit(10) 
				.populate('user', 'username fullname profilePicture') 
				.exec();
			return res.status(200).json({
				notifications: notifications
			});
		} catch (error) {
			console.log(error)
			return res.status(500).json({ error: error.message });
		}
	}
}

module.exports = new StudioController();
