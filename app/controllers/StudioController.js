import Stream from "../models/Stream.js";
import Notification from "../models/Notification.js";
import Follower from "../models/Follower.js";
import { S3_PATH, ROLE_MOD } from "../constants/index.js";
import User from "../models/User.js";
import { createIngress, generateStreamerToken, generateViewerToken } from "../common/livekit.js";
import { getObjectURL, putImageObject } from "../common/s3.js";
import { endRecord, startRecord } from "../common/livekit.js";
import History from "../models/History.js";
import Chat from "../models/Chat.js";


class StudioController {
	async saveStream(req, res) {
		try {
			const { userId, title, description, dateStream, tags, previewImage } = req.body;
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
			const base64Data = new Buffer.from(previewImage.replace(/^data:image\/\w+;base64,/, ""), 'base64');
			const type = previewImage.split(';')[0].split('/')[1];
			const imageKey = `${S3_PATH.STUDIO}/${data._id}.${type}`;
			await putImageObject(imageKey, base64Data);
			const contentType = `image/${type}`;
			const updatedData = await Stream.findByIdAndUpdate(data._id, {
				$set: { "s3.key": imageKey, "s3.contentType": contentType }
			});
			return res.status(201).json({
				message: "Create stream successfully",
				stream: updatedData
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
			if (!stream) {
				const error = new Error("Stream not found.");
				error.status = 400;
				return next(error);
			}
			const previewImage = await getObjectURL(stream?.s3?.key, stream?.s3?.contentType);
			stream.user.profilePicture = await getObjectURL(
				stream.user.profilePictureS3.key,
				stream.user.profilePictureS3.contentType
			);
			return res.status(200).json({
				stream: {
					...stream,
					previewImage
				}
			})
		} catch (error) {
			console.log(error);
			return res.status(500).json({ message: error.message });
		}
	}

	async getAllComingStreams(req, res, next) {
		try {
			const userId = req?.user?.userId;
			if (!userId) {
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
			var s3Update = {}
			if (previewImage) {
				const base64Data = new Buffer.from(previewImage.replace(/^data:image\/\w+;base64,/, ""), 'base64');
				const type = previewImage.split(';')[0].split('/')[1];
				const imageKey = `${S3_PATH.STUDIO}/${currentStream._id}.${type}`;
				await putImageObject(imageKey, base64Data);
				const contentType = `image/${type}`;
				s3Update = {
					s3: {
						key: imageKey,
						contentType: contentType
					}
				}
			}
			const updatedData = await Stream.findByIdAndUpdate(streamId, {
				title: title,
				description: description,
				dateStream: dateStream,
				tags: tags,
				rerun: rerun,
				...s3Update
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

	async getAllMods(req, res, next) {
		try {
			const userId = req?.user?.userId;
			if (!userId) {
				return res.status(403).json({ message: 'Forbidden access denied' });
			}
			const user = await User.findById(userId).populate('mods.user', '-password');
			if (!user) {
				return res.status(400).json({ message: 'User not found' });
			}
			const mods = user.mods;
			return res.status(200).json({ data: mods });
		} catch (error) {
			return res.status(500).json({ message: error.message });
		}
	}

	async addMod(req, res, next) {
		try {
			const userId = req?.user?.userId;
			const { modId, role } = req.body;
			if (!userId) {
				return res.status(403).json({ message: 'Forbidden access denied' });
			}
			if (!modId) {
				return res.status(400).json({ message: 'Please provide a valid mod id' });
			}
			const mod = await User.findById(modId);
			if (!mod) {
				return res.status(400).json({ message: 'User not found' });
			}
			const updatedUser = await User.findByIdAndUpdate(userId, {
				$push: {
					mods: {
						user: modId,
						role: role || ROLE_MOD.BD
					}
				}
			})
			if (!updatedUser) {
				return res.status(500).json({ message: "Failed to add mod" });
			}

			return res.status(200).json({
				message: "Add mod successfully",
				user: updatedUser
			});
		} catch (error) {
			return res.status(500).json({ message: error.message });
		}
	}

	async deleteMod(req, res, next) {
		try {
			const userId = req?.user?.userId;
			const { modId } = req.params;

			if (!userId) {
				return res.status(403).json({ message: 'Forbidden access denied' });
			}
			if (!modId) {
				return res.status(400).json({ message: 'Please provide a valid mod id' });
			}

			const updatedUser = await User.findByIdAndUpdate(userId, {
				$pull: {
					mods: { user: modId }
				}
			}, { new: true });

			if (!updatedUser) {
				return res.status(500).json({ message: "Failed to delete mod" });
			}

			return res.status(200).json({
				message: "Delete mod successfully",
				user: updatedUser
			});
		} catch (error) {
			return res.status(500).json({ message: error.message });
		}
	}

	async startStream(req, res, next) {
		try {
			const streamId = req.params.streamId;
			const stream = await Stream.findByIdAndUpdate(streamId, { started: true });
			const egressId = await startRecord(streamId);
			return res.status(200).json({
				stream,
				egressId
			});
		} catch (error) {
			return res.status(500).json({ message: error.message });
		}
	}

	async endStream(req, res, next) {
		try {
			const { streamId, egressId } = req.params;
			const stream = await Stream.findByIdAndUpdate(streamId, { finished: true });
			await endRecord(egressId);
			return res.status(200).json({
				stream
			});
		} catch (error) {
			return res.status(500).json({ message: error.message });
		}
	}
	// async statsNewFollowerAndSubs(req, res, next) {
	// 	try {
	// 		const latestStream = await Stream.
	// 	} catch (error) {
	// 		return res.status(500).json({ message: error.message });
	// 	}
	// }
	async getServerUrlAndStreamKey(req, res) {
		try {
			const { username, streamId } = req.params
			const ingress = await createIngress(streamId, username);

			return res.status(200).json({
				serverUrl: ingress.url,
				streamKey: ingress.streamKey
			});
		} catch (error) {
			console.log(error);
			return res.status(500).json({ message: error.message });
		}
	}

	async getStreamerToken(req, res) {
		try {
			const { streamId } = req.body;
			const token = await generateStreamerToken(streamId);
			return res.status(200).json({
				token
			});
		} catch (error) {
			console.log(error);
			return res.status(500).json({ message: error.message });
		}
	}

	async getViewerToken(req, res) {
		try {
			const { streamId } = req.body;
			const userId = req.user.userId;
			const token = await generateViewerToken(streamId, userId);
			return res.status(200).json({
				token
			});
		} catch (error) {
			console.log(error);
			return res.status(500).json({ message: error.message });
		}
	}

	async deleteSavedStreams(req, res) {
		try {
			const { streamIds } = req.body;
			const userId = req.user.userId;
			const deleteHistoryResult = await History.deleteMany({ stream: { $in: streamIds } });
			const deleteChatResult = await Chat.deleteMany({ stream: { $in: streamIds } });
			const result = await Stream.deleteMany({ _id: { $in: streamIds }, user: userId });
			if (result.deletedCount === 0) {
				return res.status(404).json({ message: 'No streams found to delete' });
			}
			return res.status(200).json(
				{
					message: `${result.deletedCount} ${result.deletedCount > 1 ? "streams" : "stream"} deleted successfully`
				}
			);
		} catch (error) {
			console.log(error);
			return res.status(500).json({ message: error.message });
		}
	}
}

export default new StudioController();
