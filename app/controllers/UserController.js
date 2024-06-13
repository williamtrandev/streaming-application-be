import User from "../models/User.js";
import redisClient from '../common/redis.js';
import fs from "fs";
import path from "path";
import Follower from "../models/Follower.js";
import cloudinaryService from '../common/cloudinary.js';
import { CLOUDINARY_FOLDER } from "../constants/index.js";

class UserController {
    async changeProfilePicture(req, res) {
        try {
            const userId = req.user.userId;
            const { profilePicture } = req.body;

            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }

            if (user.profilePicture.publicId != process.env.DEFAULT_PROFILE_PICTURE_PUBLIC_ID) {
                const deleteResult = await cloudinaryService.getInstance().deleteImage(user.profilePicture.publicId);
            }
            const newProfilePicture = await cloudinaryService.getInstance().uploadImage(profilePicture, CLOUDINARY_FOLDER.PROFILE_PICTURE);
            user.profilePicture = {
                publicId: newProfilePicture.public_id,
                url: newProfilePicture.secure_url
            };
            await user.save();
            return res.status(200).json({
                newProfilePicture: user.profilePicture.url,
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

            if (user.profileBanner.publicId != process.env.DEFAULT_PROFILE_BANNER_PUBLIC_ID) {
                const deleteResult = await cloudinaryService.getInstance().deleteImage(user.profileBanner.publicId);
            }
            const newProfileBanner = await cloudinaryService.getInstance().uploadImage(profileBanner, CLOUDINARY_FOLDER.PROFILE_BANNER);
            user.profileBanner = {
                publicId: newProfileBanner.public_id,
                url: newProfileBanner.secure_url
            };
            await user.save();
            return res.status(200).json({
                newProfilePicture: user.profileBanner.url,
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
            return res.status(200).json({
                profilePicture: user.profilePicture.url,
                profileBanner: user.profileBanner.url,
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
            return res.status(200).json({
                profilePicture: user.profilePicture.url,
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
            return res.status(200).json({
                message: "Followed successfully",
                receiveNotification: data.receiveNotification
            });
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    }

    async getFollowedChannels(req, res, next) {
        try {
            const userId = req.user.userId;
            const followers = await Follower.find({
                user: userId
            });
            console.log(followers);
            return res.status(200).json({ message: "Followed successfully" });
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

            return res.status(200).json({
                _id: user._id,
                profilePicture: user.profilePicture.url,
                profileBanner: user.profileBanner.url,
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
