import logger from '../common/logger.js';
import redisClient from '../common/redis.js';
import { getObjectURL } from '../common/s3.js';
import Chat from "../models/Chat.js";

class ChatController {
	async sendMessage(req, res, next) {
		try {
			logger.info("Start send message api with body: " + req.body);
			const { userId, streamId, duration, content, isStreamer } = req.body;
			if (!userId || !streamId || !duration || !content) {
				return res.status(400).json({ message: 'Please provide userId, streamId, duration and content' });
			}
			const data = await Chat.create({
				user: userId,
				stream: streamId,
				duration: duration,
				content: content,
				isStreamer: isStreamer
			});
			if (!data) {
				return res.status(500).json({ message: "Failed to send message to the database" });
			}
			return res.status(200).json({ msg: "Send message successfully" });
		} catch (error) {
			logger.error("Call api send message error: " + error);
			return res.status(500).json({ error: error.message });
		}
	}

	async getAllMessages(req, res, next) {
		try {
			const { streamId } = req.params;
			logger.info("Call api get all messages of stream " + streamId);
			const { limit } = req.query;
			let query = Chat.find({ stream: streamId });
			if (limit) {
				query = query.limit(parseInt(limit)); // parse limit to integer
			}
			const messages = await query
				.populate({
					path: 'user',
					select: '_id username email fullname profilePictureS3'
				})
				.lean()
				.exec();
			const promises = messages.map(async (message) => {
				if (message.user.profilePictureS3) {
					const s3Image = await getObjectURL(
						message.user.profilePictureS3.key,
						message.user.profilePictureS3.contentType
					);
					message.user.profilePictureS3 = s3Image;
				} else {
					message.user.profilePictureS3 = null;
				}
				return message;
			});

			const updatedMessages = await Promise.all(promises);

			return res.json({
				messages: updatedMessages
			});
		} catch (error) {
			logger.error("Call api get all message error: " + error);
			return res.status(500).json({ error: error.message });
		}
	}
}

export default new ChatController();
