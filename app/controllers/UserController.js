const User = require("../models/User");
const redisClient = require('../common/redis').getClient();
const fs = require("fs");
const path = require("path");

class UserController {
    async changeProfilePicture(req, res) {
        try {
            const userId = req.user.userId;
            const file = req.file;

            const user = await User.findById(userId);
            if (!user) {
                return res.status(400).json({ error: "User not found." });
            }

            const url = user.profilePicture;
            const parts = url.split('/');
            const filename = parts[parts.length - 1];
            if (filename != "user.jpg") {
                const folderPath = path.join(__dirname, '..', '..', '/public/profile-picture');
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
            return res.status(500).json({ error: error.message });
        }
    }

    async changeProfileBanner(req, res) {
        try {
            const userId = req.user.userId;
            const file = req.file;

            const user = await User.findById(userId);
            if (!user) {
                return res.status(400).json({ error: "User not found." });
            }

            const url = user.profileBanner;
            const parts = url.split('/');
            const filename = parts[parts.length - 1];
            if (filename != "user.jpg") {
                const folderPath = path.join(__dirname, '..', '..', '/public/profile-banner');
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
            return res.status(500).json({ error: error.message });
        }
    }

    async changeProfileInfo(req, res) {
        try {
            const userId = req.user.userId;
            const { fullname, about } = req.body;
            if (!fullname || !about) {
                return res.status(400).json({ error: "Please enter new display name and new about." });
            }
            const user = await User.findById(userId);
            if (!user) {
                return res.status(400).json({ error: "User not found." });
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
            return res.status(500).json({ error: error.message });
        }
    }

    async follow(req, res, next) {
        try {
            const { followId } = req.body;
            if (!followId) {
                return res.status(400).json({ message: 'Please enter followId' });
            }
            const userId = req.user.userId;
            const updatedUser = await User.findByIdAndUpdate(
                userId,
                { $push: { follows: { user: followId } } },
                { new: true }
            );

            if (!updatedUser) {
                return res.status(400).json({ message: "User not found" });
            }

            return res.status(200).json({ message: "Followed successfully", user: updatedUser });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    async getProfile(req, res) {
        try {
            const { userId } = req.params;
            const user = await User.findById(userId);
            if (!user) {
                return res.status(400).json({ error: "User not found." });
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
            return res.status(500).json({ error: error.message });
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
            return res.status(500).json({ error: error.message });
        }
    }

    async changeLinks(req, res) {
        try {
            const userId = req.user.userId;
            const { links } = req.body;
            if (!links) {
                return res.status(400).json({ error: "Please enter new social links." });
            }
            const user = await User.findById(userId);
            if (!user) {
                return res.status(400).json({ error: "User not found." });
            }
            user.links= links;
            await user.save();
            return res.status(200).json({
                newLinks: links,
                message: "Change user's social links successfully."
            });
        } catch (error) {
            return res.status(500).json({ error: error.message });
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
            return res.status(500).json({ error: error.message });
        }
    }
}

module.exports = new UserController();
