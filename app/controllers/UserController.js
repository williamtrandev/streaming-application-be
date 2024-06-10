import User from "../models/User.js";
import redisClient from '../common/redis.js';
import fs from "fs";
import path from "path";
import Follower from "../models/Follower.js";
import { fileURLToPath } from 'url';

class UserController {
    async changeProfilePicture(req, res) {
        try {
            const userId = req.user.userId;
            const file = req.file;

            const user = await User.findById(userId);
            if (!user) {
                return res.status(400).json({ message: "User not found." });
            }

            // Lấy đường dẫn file hiện tại
            const __filename = fileURLToPath(import.meta.url);

            // Lấy đường dẫn thư mục hiện tại
            const __dirname = path.dirname(__filename);

            const url = user.profilePicture;
            const parts = url.split('/');
            const filename = parts[parts.length - 1];
            if (filename !== "user.jpg") {
                const folderPath = path.join(__dirname, '..', '..', 'public', 'profile-picture');
                const filePath = path.join(folderPath, filename);
                fs.unlinkSync(filePath);
            }
            user.profilePicture = `${process.env.IMG_LINK}/profile-picture/${file.filename}`;
            await user.save();
            return res.status(200).json({
                newProfilePicture: user.profilePicture,
                message: "Change profile picture successfully."
            });
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    }

    async changeProfileBanner(req, res) {
        try {
            const userId = req.user.userId;
            const file = req.file;

            const user = await User.findById(userId);
            if (!user) {
                return res.status(400).json({ message: "User not found." });
            }

            // Lấy đường dẫn file hiện tại
            const __filename = fileURLToPath(import.meta.url);

            // Lấy đường dẫn thư mục hiện tại
            const __dirname = path.dirname(__filename);

            const url = user.profileBanner;
            const parts = url.split('/');
            const filename = parts[parts.length - 1];
            if (filename !== "user.jpg") {
                const folderPath = path.join(__dirname, '..', '..', 'public', 'profile-banner');
                const filePath = path.join(folderPath, filename);
                fs.unlinkSync(filePath);
            }
            user.profileBanner = `${process.env.IMG_LINK}/profile-banner/${file.filename}`;
            await user.save();
            return res.status(200).json({
                newProfilePicture: user.profileBanner,
                message: "Change profile banner successfully."
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
                return res.status(400).json({ message: "Please enter new display name." });
            }
            const user = await User.findById(userId);
            if (!user) {
                return res.status(400).json({ message: "User not found." });
            }
            user.fullname = newDisplayName;
            await user.save();
            return res.status(200).json({
                newDisplayName: user.fullname,
                message: "Change display name successfully."
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
                return res.status(400).json({ message: "Please enter new display name and new about." });
            }
            const user = await User.findById(userId);
            if (!user) {
                return res.status(400).json({ message: "User not found." });
            }
            user.fullname = fullname;
            user.about = about;
            await user.save();
            return res.status(200).json({
                newUserInfo: {
                    fullname: user.fullname,
                    about: user.about
                },
                message: "Change user's informations successfully."
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
                return res.status(400).json({ message: "User not found." });
            }
            const today = new Date();
            return res.status(200).json({
                profilePicture: user.profilePicture,
                profileBanner: user.profileBanner,
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
                return res.status(400).json({ message: "User not found." });
            }
            return res.status(200).json({
                profilePicture: user.profilePicture,
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
                return res.status(400).json({ message: "Please enter new social links." });
            }
            const user = await User.findById(userId);
            if (!user) {
                return res.status(400).json({ message: "User not found." });
            }
            user.links = links;
            await user.save();
            return res.status(200).json({
                newLinks: links,
                message: "Change user's social links successfully."
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
                return res.status(400).json({ message: "User not found." });
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
            const { followerId } = req.body;
            if (!followerId) {
                return res.status(400).json({ message: 'Please enter followId' });
            }
            const userId = req.user.userId;
            const data = await Follower.create({
                user: userId,
                follower: followerId
            });
            if (!data) {
                return res.status(500).json({ message: "Failed to follow user" });
            }
            return res.status(200).json({ message: "Followed successfully" });
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
                return res.status(400).json({ message: "User not found." });
            }
            const numFollowers = await Follower.countDocuments({ user: user._id });
            
            return res.status(200).json({
                profilePicture: user.profilePicture,
                profileBanner: user.profileBanner,
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
                return res.status(400).json({ message: "User not found." });
            }
            
            return res.status(200).json({
                about: user.about,
                links: user.links
            });
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    }
}

export default new UserController();
