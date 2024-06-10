import Stream from "../models/Stream.js";
import Notification from "../models/Notification.js";
import Follower from "../models/Follower.js";
import { AccessToken } from 'livekit-server-sdk';
import { v4 as uuidv4 } from 'uuid';
import cloudinaryService from '../common/cloudinary.js';
import { CLOUDINARY_FOLDER } from "../constants/index.js";

class StudioController {
	async saveStream(req, res) {
		try {
			const { userId, title, description, dateStream, tags, previewImage } = req.body;
			if (!userId || !title || !description || !dateStream) {
				return res.status(400).json({ message: "Please enter userId, title, description, dateStream" });
			}
			const newPreviewImage = await cloudinaryService.getInstance().uploadImage(previewImage, CLOUDINARY_FOLDER.STUDIO);
			const data = await Stream.create({
				user: userId,
				title: title,
				description: description,
				dateStream: dateStream,
				tags: tags,
				previewImage: {
					publicId: newPreviewImage.public_id,
					url: newPreviewImage.secure_url
				}
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
			const followers = await Follower.find({ streamer: userId, receiveNotification: true });
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

	async getDetailStream(req, res, next) {
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
			return res.status(200).json({
				stream: stream
			})
		} catch (error) {
			return res.status(500).json({ message: error.message });
		}
	}

	async getAllComingStreams(req, res, next) {
		try {
			const userId = req?.user?.userId;
			if(!userId) {
				return res.status(403).json({ message: 'Access denied' });
			}
			const comingStreams = await Stream.find({ 
				user: userId,
				started: false 
			}).lean();
			return res.status(200).json({
				data: comingStreams
			})
		} catch (error) {
			return res.status(500).json({ message: error.message });
		}
	}

	async editStream(req, res, next) {
		try {
			const { streamId } = req.params;
			const { title, description, dateStream, tags, previewImage, rerun } = req.body;
			const currentStream = await Stream.findById(streamId);
			if (!currentStream) {
				return res.status(404).json({ message: "Stream not found" });
			}
			let newPreviewImage = {};
			if (previewImage) {
				newPreviewImage = await cloudinaryService.getInstance().uploadImage(previewImage, 'studio');
				if (currentStream.previewImage && currentStream.previewImage.publicId) {
					await cloudinaryService.getInstance().deleteImage(currentStream.previewImage.publicId);
				}
			} else {
				newPreviewImage = currentStream.previewImage;
			}
			const updatedData = await Stream.findByIdAndUpdate(streamId, {
				title: title,
				description: description,
				dateStream: dateStream,
				tags: tags,
				previewImage: newPreviewImage,
				rerun: rerun
			}, { new: true });
			if (!updatedData) {
				return res.status(500).json({ message: "Failed to update stream" });
			}

			return res.status(200).json({
				message: "Update stream successfully",
				stream: updatedData
			});
		} catch (error) {
			return res.status(500).json({ message: error.message });
		}
	}

	async deleteStream(req, res, next) {
		try {
			const { streamId } = req.params;
			const deletedStream = await Stream.findByIdAndDelete(streamId);
			if (!deletedStream) {
				return res.status(404).json({ message: 'Stream not found' });
			}
			res.status(204).json({ message: 'Stream deleted successfully' });
		} catch (error) {
			return res.status(500).json({ message: error.message });
		}
}
}

export default new StudioController();
