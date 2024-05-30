const redisClient = require('../common/redis').getClient();
const Chat = require("../models/Chat");
class ChatController {
	async sendMessage(req, res, next) {
		try {
			const { userId, streamId, duration, content } = req.body;
			if (!userId || !streamId || !duration || !content) {
				return res.status(400).json({ message: 'Please provide userId, streamId, duration and content' });
			}
			const data = await Chat.create({
				userId: userId,
				streamId: streamId,
				duration: duration,
				content: content
			});
			if (!data) {
				return res.status(500).json({ message: "Failed to send message to the database" });
			}
			return res.status(200).json({ msg: "Send message successfully" });
		} catch(error) {
			return res.status(500).json({ error: error.message });
		}
	}
}

module.exports = new ChatController();