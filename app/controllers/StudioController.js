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
import logger from "../common/logger.js";


class StudioController {
	async saveStream(req, res) {
		try {
			const { userId, title, description, dateStream, tags, previewImage, rerun } = req.body;
			logger.info(`Start save stream api with body ${req.body}`);
			if (!userId || !title || !description || !dateStream) {
				return res.status(400).json({ message: "Please enter userId, title, description, dateStream" });
			}
			const data = await Stream.create({
				user: userId,
				title: title,
				description: description,
				dateStream: dateStream,
				tags: tags,
				rerun: rerun
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
			logger.error("Call save stream api error: " + error);
			return res.status(500).json({ message: error.message });
		}
	}
	async saveNotification(req, res, next) {
		try {
			const { userId, content } = req.body;
			logger.info(`Start save notification with body ${req.body}`);
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
			logger.error("Call save notification api error: " + error);
			return res.status(500).json({ message: error.message });
		}
	}
	async getNotification(req, res, next) {
		try {
			const userId = req.user.userId;
			logger.info(`Start get notification for ${userId}`);
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
			logger.error("Call get notification api error: " + error);
			return res.status(500).json({ message: error.message });
		}
	}

	async getDetailStream(req, res, next) {
		try {
			const { streamId } = req.params;
			logger.info(`Start get detail stream api with streamId ${streamId}`);
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
			const numFollowers = await Follower.countDocuments({ streamer: stream.user._id });
			stream.user.numFollowers = numFollowers;
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
			logger.info(`Start get all coming streams api for ${userId}`);
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
			logger.error("Call get all coming streams api error: " + error);
			return res.status(500).json({ message: error.message });
		}
	}

	async editStream(req, res, next) {
		try {
			const { streamId } = req.params;
			logger.info(`Start edit stream api with streamId ${streamId}, body ${req.body}`)
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
			logger.error("Call edit stream api error: " + error);
			return res.status(500).json({ message: error.message });
		}
	}

	async deleteStream(req, res, next) {
		try {
			const { streamId } = req.params;
			logger.info(`Start delete stream api with streamId ${streamId}`);
			const deletedStream = await Stream.findByIdAndDelete(streamId);
			if (!deletedStream) {
				return res.status(404).json({ message: 'Stream not found' });
			}
			res.status(204).json({ message: 'Stream deleted successfully' });
		} catch (error) {
			logger.error("Call delete stream api error: " + error);
			return res.status(500).json({ message: error.message });
		}
	}

	async getAllMods(req, res, next) {
		try {
			const userId = req?.user?.userId;
			logger.info(`Start get all mods api with userId ${userId}`);
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
			logger.error("Call get all mods api error: " + error);
			return res.status(500).json({ message: error.message });
		}
	}

	async addMod(req, res, next) {
		try {
			const userId = req?.user?.userId;
			const { modId, role } = req.body;
			logger.info(`Start add mod api with userId: ${userId}, body: ${req.body}`);
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
			logger.error("Call add mods api error: " + error);
			return res.status(500).json({ message: error.message });
		}
	}

	async deleteMod(req, res, next) {
		try {
			const userId = req?.user?.userId;
			const { modId } = req.params; 
			logger.info(`Start delete mod api with userId ${userId}, modId ${modId}`);
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
			logger.error("Call delete mods api error: " + error);
			return res.status(500).json({ message: error.message });
		}
	}

	async startStream(req, res, next) {
		try {
			const streamId = req.params.streamId;
			logger.info(`Start start stream api with streamId ${streamId}`);
			const stream = await Stream.findByIdAndUpdate(streamId, { 
				started: true,
				startAt: Date.now()
			}).lean();
			const user = await User.findByIdAndUpdate(stream.user, { isLive: true });
			var egressId =  null;
			if(stream.rerun) {
				egressId = await startRecord(streamId);
			}
			return res.status(200).json({
				stream,
				egressId
			});
		} catch (error) {
			logger.error("Call start stream api error: " + error);
			return res.status(500).json({ message: error.message });
		}
	}

	async endStream(req, res, next) {
		try {
			const { streamId, egressId } = req.params;
			logger.info(`Start end stream api with streamId ${streamId}, egressId ${egressId}`);
			const stream = await Stream.findByIdAndUpdate(streamId, { 
				finished: true,
				finishAt: Date.now()
			}).lean();
			const user = await User.findByIdAndUpdate(stream.user, { isLive: false });
			if(stream.rerun) {
                await endRecord(egressId);
            }
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
			const { username, streamId } = req.params;
			logger.info(`Start get server url and stream key username ${username}, streamId ${streamId}`);
			const ingress = await createIngress(streamId, username);

			return res.status(200).json({
				serverUrl: ingress.url,
				streamKey: ingress.streamKey
			});
		} catch (error) {
			logger.error("Call get server url and stream key api error: " + error);
			return res.status(500).json({ message: error.message });
		}
	}

	async getStreamerToken(req, res) {
		try {
			const { streamId } = req.body;
			logger.info(`Start get stream token with streamId ${streamId}`);
			const token = await generateStreamerToken(streamId);
			return res.status(200).json({
				token
			});
		} catch (error) {
			logger.error("Call get stream token api error: " + error);
			return res.status(500).json({ message: error.message });
		}
	}

	async getViewerToken(req, res) {
		try {
			const { streamId, userId } = req.body;
			logger.info(`Start get viewer token with streamId ${streamId}, userId ${userId}`);

			const token = await generateViewerToken(streamId, userId);
			return res.status(200).json({
				token
			});
		} catch (error) {
			logger.error("Call get viewer token api error: " + error);
			return res.status(500).json({ message: error.message });
		}
	}

	async getVideoRecord(req, res, next) {
		try {
			const streamId = req.params.streamId;
			logger.info(`Start get video record api with streamId ${streamId}`)
			const streamLink = await getObjectURL(`record/${streamId}`);
			return res.status(200).json({
                streamLink
            });
		} catch(error) {
			logger.error("Call get video record api error: " + error);
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
