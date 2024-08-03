import redisClient from '../common/redis.js';
import User from "../models/User.js";
import { sendMailToUser } from "../common/mail.js";
import logger from '../common/logger.js';
import Stream from '../models/Stream.js';
import Follower from '../models/Follower.js';
import { getObjectURL } from "../common/s3.js";
import StatsViewer from '../models/StatsViewer.js';
import Admin from '../models/Admin.js';
import bcrypt from 'bcrypt';
import jwt from "jsonwebtoken";
import { isValidEmail } from '../common/utils.js';

class AdminController {
	async actionStreamer(req, res, next) {
		try {
			const streamerId = req.params.streamerId;
			const typeAction = req.query.type;
			logger.info(`Start ban streamer api with streamerId: ${streamerId}, type: ${typeAction}`);
			const streamer = await User.findById(streamerId);
			if (!streamer) {
				return res.status(400).json({ message: 'Streamer not found' });
			}
			streamer.numBans = typeAction === 'ban' ? 3 : 0;
			await streamer.save();
			const subject = typeAction === 'ban' ? '[Duo Streaming] Ban Streamer' : '[Duo Streaming] Unban Streamer';
			const context = {
				username: streamer.username
			}
			const template = typeAction === 'ban' ? 'banStreamer' : 'unbanStreamer';
			sendMailToUser(streamer.email, subject, template, context);
			return res.status(200).json({ msg: "Send message successfully" });
		} catch (error) {
			next(error);
		}
	}
	async getStreamer(req, res, next) {
		try {
			const { page } = req.params;
			let { q, limit } = req.query;
			if (!limit) {
				limit = 10;
			}
			logger.info(`Start get streamer api with page: ${page}, limit: ${limit}, q: ${q}`);
			const userIds = await Stream.distinct('user');
			const skip = (page - 1) * limit; 
			const searchQuery = q ? {
				$or: [
					{ username: { $regex: new RegExp(q, 'i') } },
					{ email: { $regex: new RegExp(q, 'i') } },
					{ fullname: { $regex: new RegExp(q, 'i') } }
				]
			} : {};
			var streamers = await User.find({ _id: { $in: userIds }, ...searchQuery })
				.skip(skip)
				.limit(limit);
			const totalStreamers = await User.countDocuments({ _id: { $in: userIds }, ...searchQuery });
			const numPages = Math.ceil(totalStreamers / limit);
			streamers = await Promise.all(
				streamers.map(async (streamer) => {
					const profilePictureS3 = await getObjectURL(streamer.profilePictureS3.key, streamer.profilePictureS3.contentType);
					return { ...streamer.toObject(), profilePictureS3 };
				})
			);
			return res.status(200).json({
				streamers,
				numPages
			});
		} catch (error) {
			next(error);
		}
	}
	async getDetailStreamer(req, res, next) {
		try {
			const { streamerId } = req.params;
			logger.info(`Start get streamer's detail api with streamerId: ${streamerId}`);
			const user = await User.findById(streamerId).select('-password').lean();
			if (!user) {
				return res.status(404).json({ message: "User not found" });
			}
			const numFollowers = await Follower.countDocuments({ streamer: user._id });
			const profilePicture = await getObjectURL(user.profilePictureS3.key, user.profilePictureS3.contentType);
			const profileBanner = await getObjectURL(user.profileBannerS3.key, user.profileBannerS3.contentType);
			return res.status(200).json({
				...user, 
				profilePicture: profilePicture,
				profileBanner: profileBanner,
				numFollowers: numFollowers
			});
		} catch (error) {
			next(error);
		}
	}
	async banStream(req, res, next) {
		try {
			const streamId = req.params.streamId;
			logger.info(`Start ban streamer api with streamId: ${streamId}`);
			const stream = await Stream.findById(streamId).populate('user');
			if (!stream) {
				return res.status(400).json({ message: 'Stream not found' });
			}
			stream.isBanned = true;
			stream.user.numBans = (typeof stream.user.numBans === 'undefined') ? 1 : stream.user.numBans + 1;
			await stream.user.save();
			await stream.save();
			const subject = '[Duo Streaming] Ban Stream';
			const context = {
				username: stream.user.username
			}
			const template = 'warningStream';
			sendMailToUser(stream.user.email, subject, template, context);
			if(stream.user.numBans >= 3) {
				const subjectBanStreamer = '[Duo Streaming] Ban Streamer';
				const templateBanStreamer = 'banStreamer';
				sendMailToUser(stream.user.email, subjectBanStreamer, templateBanStreamer, context);
			}
			return res.status(200).json({ msg: "Send message successfully" });
		} catch (error) {
			next(error);
		}
	}
	async overview(req, res, next) {
		try {
			const { from, to } = req.query;
			logger.info(`Start overview api with fromDate: ${from}, toDate: ${to}`);
			const fromDate = new Date(from);
			fromDate.setHours(0, 0, 0, 0);
			const toDate = new Date(to);
			toDate.setHours(23, 59, 59, 999);
			const deltaDate = new Date(toDate - fromDate);
			const toDateCompare = new Date(fromDate.getTime() - 1000);
			const fromDateCompare = new Date(toDateCompare.getTime() - deltaDate.getTime());
			fromDateCompare.setHours(0, 0, 0, 0);
			const streams = await Stream.countDocuments({ createdAt: { $gte: fromDate, $lte: toDate } });
			const users = await User.countDocuments();
			const stats = await StatsViewer.find().lean();
			const streamsCompare = await Stream.countDocuments({ createdAt: { $gte: fromDateCompare, $lte: toDateCompare } });
			const usersCompare = await User.countDocuments({ createdAt: { $gte: fromDateCompare, $lte: toDateCompare } });
			const statsCompare = await StatsViewer.find({ createdAt: { $gte: fromDateCompare, $lte: toDateCompare } }).lean();
			const numViewersPerMin = stats.reduce((total, doc) => {
				const docTotal = doc.numViewersPerMin.reduce((sum, entry) => sum + entry.count, 0);
				return total + docTotal;
			}, 0);
			const numViewersPerMinCompare = statsCompare.reduce((total, doc) => {
				const docTotal = doc.numViewersPerMin.reduce((sum, entry) => sum + entry.count, 0);
				return total + docTotal;
			}, 0);
			const calculateGrowth = (finalValue, beforeValue) => {
				if (beforeValue === 0) {
					return finalValue === 0 ? 0 : 'Infinity';
				}
				return ((finalValue - beforeValue) / beforeValue) * 100;
			};
			return res.status(200).json({ 
				data: {
					streams,
					users,
					numViewersPerMin
				},
				growth: {
					streams: calculateGrowth(streams, streamsCompare),
					users: calculateGrowth(users, usersCompare),
					numViewersPerMin: calculateGrowth(numViewersPerMin, numViewersPerMinCompare)
				}
			});
		} catch (error) {
			next(error);
		}
	}

	async login(req, res, next) {
		try {
			logger.info("Start admin login api");
			const { username, password } = req.body;
			if (!username || !password) {
				return res.status(400).json({ message: "Please enter username and password" });
			}
			const admin = await Admin.findOne({ username: username }).lean();
			if (!admin) {
				return res.status(401).json({ message: "Incorrect username or password" });
			}
			const match = await bcrypt.compare(password, admin.password);
			if (match) {
				const token = jwt.sign(
					{ userId: admin._id },
					process.env.JWT_SECRET,
					{ expiresIn: process.env.TOKEN_EXPIRE } 
				);
				const refreshToken = jwt.sign(
					{ userId: admin._id }, 
					process.env.REFRESH_JWT_SECRET,
					{ expiresIn: process.env.REFRESH_EXPIRE }
				);

				const { password: pwd, ...userWithoutPassword } = admin;
				return res.status(200).json({
					user: userWithoutPassword,
					accessToken: token,
					refreshToken: refreshToken
				});
			} else {
				return res.status(401).json({ message: "Incorrect username or password" });
			}
		} catch (error) {
			next(error);
		}
	}

	async getSettings(req, res, next) {
        try {
            const userId = req.user.userId;
            logger.info(`Start get admin settings api for ${userId}`);
            const admin = await Admin.findById(userId);
            if (!admin) {
                return res.status(404).json({ message: "User not found" });
            }
            return res.status(200).json({
                email: admin.email,
				username: admin.username
            });
        } catch (error) {
            next(error);
        }
    }

	async changeEmail(req, res, next) {
		try {
			const userId = req.user.userId;
			const { email, otp } = req.body;
			logger.info(`Start change admin email api for ${userId}, new email ${email}`);
			if (!email) {
				return res.status(400).json({ message: "Please enter new email address" });
			}
			if (!isValidEmail(email)) {
				return res.status(400).json({ message: "Invalid email address" });
			}
			if (!otp) {
				return res.status(400).json({ message: "Required field 'otp' is missing" });
			}
			const cachedOTP = await redisClient.getInstance().get(email);
			if (!cachedOTP) {
				return res.status(400).json({ message: "OTP has expired" });
			}
			if (cachedOTP != otp) {
				return res.status(400).json({ message: "OTP is not match" });
			}
			const admin = await Admin.findById(userId);
			if (!admin) {
				return res.status(400).json({ message: "User not found" });
			}
			admin.email = email;
			await admin.save();
			return res.status(200).json({
				newEmail: admin.email,
				message: "Change email address successfully"
			});
		} catch (error) {
			next(error);
		}
	}

	async changePassword(req, res, next) {
		try {
			const userId = req.user.userId;
			const { oldPassword, newPassword } = req.body;
			logger.info(`Start change admin password api for ${userId}`);
			if (!oldPassword || !newPassword) {
				return res.status(400).json({
					message: "Please enter old password and new password"
				});
			}
			const user = await Admin.findById(userId);
			if (!user) {
				return res.status(400).json({ message: "User not found" });
			}
			const match = await bcrypt.compare(oldPassword, user.password);
			if (match) {
				const newHashPassword = await bcrypt.hash(newPassword, 10);
				user.password = newHashPassword;
				await user.save();
				return res.status(200).json({ message: "Change password successfully" });
			} else {
				return res.status(400).json({ message: "Your current password was incorrect" });
			}
		} catch (error) {
			next(error);
		}
	}

	async changeUsername(req, res, next) {
		try {
			const userId = req.user.userId;
			const { username, password } = req.body;
			logger.info(`Start change admin username api for ${userId}, new username ${username}`);
			if (!username || !password) {
				return res.status(400).json({
					message: "Please enter password and new username"
				});
			}
			const user = await Admin.findById(userId);
			if (!user) {
				return res.status(400).json({ message: "User not found" });
			}
			
			const match = await bcrypt.compare(password, user.password);
			if (match) {
				user.username = username;
				await user.save();
				return res.status(200).json({ 
					message: "Change username successfully.",
					newUsername: user.username
				})
			} else {
				return res.status(400).json({ message: "Your password was incorrect" });
			}
		} catch (error) {
			next(error);
		}
	}
	
}

export default new AdminController();
