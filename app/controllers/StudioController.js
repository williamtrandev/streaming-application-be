import Stream from "../models/Stream.js";
import Notification from "../models/Notification.js";
import Follower from "../models/Follower.js";
import { AccessToken } from 'livekit-server-sdk';
import { v4 as uuidv4 } from 'uuid';
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
			return res.status(500).json({ message: error.message });
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
			return res.status(500).json({ message: error.message });
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
			return res.status(500).json({ message: error.message });
		}
	}

	// async generateTokenStream(req, res, next) {
	// 	try {
	// 		const { userId, streamId } = req.body;
	// 		const token = await generateStreamerToken(streamId);
	// 		return res.status(200).json({
	// 			token: token
	// 		})
	// 	} catch(error) {
	// 		return res.status(500).json({ message: error.message });
	// 	}
	// }

	async getDetailStreamAndToken(req, res, next) {
		try {
			const { streamId } = req.params;
			const userId = req?.user?.userId;
			const stream = await Stream.findById(streamId)
				.populate({
					path: 'user',
					select: '-password'
				}).lean();
			if(!stream) {
				const error = new Error("Stream not found.");
				error.status = 400;
				return next(error);
			}
			const identity = userId || uuidv4();
			const at = new AccessToken(process.env.LIVEKIT_API_KEY, process.env.LIVEKIT_API_SECRET, {
				identity: identity,
			});
			at.addGrant({ roomJoin: true, room: streamId });
			const token = await at.toJwt();
			return res.status(200).json({
				stream: stream,
				token: token
			})
		} catch (error) {
			return res.status(500).json({ message: error.message });
		}
	}
}

export default new StudioController();
