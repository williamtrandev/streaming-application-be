import redisClient from '../common/redis.js';
import Chat from "../models/Chat.js";

class ChatController {
	async sendMessage(req, res, next) {
		try {
			const { userId, streamId, duration, content } = req.body;
			if (!userId || !streamId || !duration || !content) {
				return res.status(400).json({ message: 'Please provide userId, streamId, duration and content' });
			}
			const data = await Chat.create({
				user: userId,
				stream: streamId,
				duration: duration,
				content: content
			});
			if (!data) {
				return res.status(500).json({ message: "Failed to send message to the database" });
			}
			return res.status(200).json({ msg: "Send message successfully" });
		} catch (error) {
			return res.status(500).json({ error: error.message });
		}
	}

	async getAllMessages(req, res, next) {
		try {
			const { streamId } = req.params;
			const { limit } = req.query;
			let query = Chat.find({ stream: streamId });
			if (limit) {
				query = query.limit(parseInt(limit)); // parse limit to integer
			}
			const messages = await query
				.populate({
					path: 'user',
					select: '_id username email fullname profilePicture'
				})
				.exec();
			return res.json({
				messages: messages
			});
		} catch (error) {
			return res.status(500).json({ error: error.message });
		}
	}
}

export default new ChatController();
