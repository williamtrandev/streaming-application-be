import User from "../models/User.js";
import redisClient from '../common/redis.js';
import Follower from "../models/Follower.js";
import { Types } from "mongoose";
import { getObjectURL, putImageObject } from "../common/s3.js";
import { S3_PATH } from "../constants/index.js";

class UserController {
    async changeProfilePicture(req, res) {
        try {
            const userId = req.user.userId;
            const { profilePicture } = req.body;

            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }

            const base64Data = new Buffer.from(profilePicture.replace(/^data:image\/\w+;base64,/, ""), 'base64');
			const type = profilePicture.split(';')[0].split('/')[1];
			const imageKey = `${S3_PATH.PROFILE_PICTURE}/${user._id}.${type}`;
			await putImageObject(imageKey, base64Data);
			const contentType = `image/${type}`;
            user.profilePictureS3 = {
                key: imageKey,
                contentType: contentType
            };
            await user.save();
            const preview = await getObjectURL(imageKey, contentType);
            return res.status(200).json({
                newProfilePicture: preview,
                message: "Change profile picture successfully"
            });
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    }

    async changeProfileBanner(req, res) {
        try {
            const userId = req.user.userId;
            const { profileBanner } = req.body;

            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }

            const base64Data = new Buffer.from(profileBanner.replace(/^data:image\/\w+;base64,/, ""), 'base64');
			const type = profileBanner.split(';')[0].split('/')[1];
			const imageKey = `${S3_PATH.PROFILE_BANNER}/${user._id}.${type}`;
			await putImageObject(imageKey, base64Data);
			const contentType = `image/${type}`;
            user.profileBannerS3 = {
                key: imageKey,
                contentType: contentType
            };
            await user.save();
            const preview = await getObjectURL(imageKey, contentType);
            return res.status(200).json({
                newProfileBanner: preview,
                message: "Change profile banner successfully"
            });
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    }

    async changeDisplayName(req, res) {
        try {
            const userId = req.user.userId;
            const newDisplayName = req.body.newDisplayName;
            if (!newDisplayName) {
                return res.status(400).json({ message: "Please enter new display name" });
            }
            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }
            user.fullname = newDisplayName;
            await user.save();
            return res.status(200).json({
                newDisplayName: user.fullname,
                message: "Change display name successfully"
            });
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    }

    async changeProfileInfo(req, res) {
        try {
            const userId = req.user.userId;
            const { fullname, about } = req.body;
            if (!fullname || !about) {
                return res.status(400).json({ message: "Please enter new display name and new about" });
            }
            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }
            user.fullname = fullname;
            user.about = about;
            await user.save();
            return res.status(200).json({
                newUserInfo: {
                    fullname: user.fullname,
                    about: user.about
                },
                message: "Change user's informations successfully"
            });
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    }

    async getProfile(req, res) {
        try {
            const { userId } = req.params;
            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }
            const today = new Date();
            const profilePicture = await getObjectURL(user.profilePictureS3.key, user.profilePictureS3.contentType);
            const profileBanner = await getObjectURL(user.profileBannerS3.key, user.profileBannerS3.contentType);
            return res.status(200).json({
                profilePicture: profilePicture,
                profileBanner: profileBanner,
                username: user.username,
                fullname: user.fullname,
                about: user.about,
                links: user.links,
                canChangeUsername: (today.getDate() - user.lastChangeUsername.getDate()) >= 14
            });
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    }

    async getMiniProfile(req, res) {
        try {
            const { userId } = req.params;
            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }
            const profilePicture = await getObjectURL(user.profilePictureS3.key, user.profilePictureS3.contentType);
            return res.status(200).json({
                profilePicture: profilePicture,
                username: user.username,
                fullname: user.fullname
            });
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    }

    async changeLinks(req, res) {
        try {
            const userId = req.user.userId;
            const { links } = req.body;
            if (!links) {
                return res.status(400).json({ message: "Please enter new social links" });
            }
            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }
            user.links = links;
            await user.save();
            return res.status(200).json({
                newLinks: links,
                message: "Change user's social links successfully"
            });
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    }

    async getEmail(req, res) {
        try {
            const { userId } = req.params;
            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }
            return res.status(200).json({
                email: user.email
            });
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    }

    async follow(req, res, next) {
        try {
            const { streamerId } = req.body;
            if (!streamerId) {
                return res.status(400).json({ message: 'Please enter streamerId' });
            }
            const userId = req.user.userId;
            const data = await Follower.create({
                user: userId,
                streamer: streamerId
            });
            if (!data) {
                return res.status(500).json({ message: "Failed to follow user" });
            }
            const streamer = await User.findById(streamerId)
                .select("username fullname profilePictureS3 isLive");
            const profilePicture = await getObjectURL(
                streamer.profilePictureS3?.key,
                streamer.profilePictureS3?.contentType
            );
            return res.status(200).json({
                message: "Followed successfully",
                receiveNotification: data.receiveNotification,
                follow: {
                    streamer: {
                        _id: streamerId,
                        username: streamer.username,
                        fullname: streamer.fullname,
                        profilePicture: profilePicture,
                        isLive: streamer.isLive
                    }
                }
            });
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    }

    async getFollowedChannels(req, res, next) {
        try {
            const userId = req.params.userId;
            const followers = await Follower.aggregate([
                {
                    $match: {
                        user: Types.ObjectId.createFromHexString(userId)
                    }
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'streamer',
                        foreignField: '_id',
                        as: 'streamer'
                    }
                },
                {
                    $unwind: '$streamer'
                },
                {
                    $sort: {
                        'streamer.isLive': -1,
                        'streamer.updatedAt': -1
                    }
                },
                {
                    $project: {
                        'streamer._id': 1,
                        'streamer.username': 1,
                        'streamer.fullname': 1,
                        'streamer.profilePictureS3': 1,
                        'streamer.isLive': 1,
                        'streamer.updatedAt': 1
                    }
                }
            ]);
            for (const follow of followers) {
                const profilePicture = await getObjectURL(
                    follow.streamer.profilePictureS3?.key,
                    follow.streamer.profilePictureS3?.contentType
                );
                follow.streamer.profilePicture = profilePicture;
            }
            return res.status(200).json({ followedChannels: followers });
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    }

    async getStreamerProfile(req, res) {
        try {
            const { username } = req.params;
            const user = await User.findOne({ username: username });
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }
            const numFollowers = await Follower.countDocuments({ user: user._id });
            const profilePicture = await getObjectURL(user.profilePictureS3.key, user.profilePictureS3.contentType);
            const profileBanner = await getObjectURL(user.profileBannerS3.key, user.profileBannerS3.contentType);
            return res.status(200).json({
                _id: user._id,
                profilePicture: profilePicture,
                profileBanner: profileBanner,
                username: user.username,
                fullname: user.fullname,
                numFollowers: numFollowers
            });
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    }

    async getStreamerABout(req, res) {
        try {
            const { username } = req.params;
            const user = await User.findOne({ username: username });
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }

            return res.status(200).json({
                about: user.about,
                links: user.links
            });
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    }

    async getFollow(req, res) {
        try {
            const { userId, streamerId } = req.params;
            const follow = await Follower.findOne({ user: userId, streamer: streamerId });

            return res.status(200).json({
                follow
            });
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    }

    async toggleNotification(req, res) {
        try {
            const userId = req.user.userId;
            const { streamerId } = req.body;
            const follow = await Follower.findOneAndUpdate(
                { user: userId, streamer: streamerId },
                [{ $set: { receiveNotification: { $not: "$receiveNotification" } } }],
                { new: true }
            );

            return res.status(200).json({
                receiveNotification: follow.receiveNotification
            });
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    }

    async unfollow(req, res) {
        try {
            const { streamerId } = req.params;
            if (!streamerId) {
                return res.status(400).json({ message: 'Please enter streamerId' });
            }
            const userId = req.user.userId;
            const deletedFollow = await Follower.findOneAndDelete({
                user: userId,
                streamer: streamerId
            });
            if (!deletedFollow) {
                return res.status(500).json({ message: "Failed to unfollow user" });
            }
            return res.status(200).json({
                message: "Unollowed successfully"
            });
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    }
}

export default new UserController();
