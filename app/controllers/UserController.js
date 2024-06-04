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
                return res.status(400).json({ message: "User not found." });
            }
            
            const url = user.profile_picture;
            const parts = url.split('/');
            const filename = parts[parts.length - 1];
            if (filename != "user.jpg") {
                const folderPath = path.join(__dirname, '..', '..', '/public/profile-picture');
                const filePath = path.join(folderPath, filename);
                fs.unlinkSync(filePath);
            }
            user.profile_picture = `${process.env.API_LINK}/profile-picture/${file.filename}`;
            await user.save();
            return res.status(200).json({
                newProfilePicture: user.profile_picture,
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
                return res.status(400).json({ message: "User not found." });
            }
            
            const url = user.profile_banner;
            const parts = url.split('/');
            const filename = parts[parts.length - 1];
            if (filename != "user.jpg") {
                const folderPath = path.join(__dirname, '..', '..', '/public/profile-banner');
                const filePath = path.join(folderPath, filename);
                fs.unlinkSync(filePath);
            }
            user.profile_banner = `${process.env.API_LINK}/profile-banner/${file.filename}`;
            await user.save();
            return res.status(200).json({
                newProfilePicture: user.profile_banner,
                message: "Change profile banner successfully."
            });
        } catch (error) {
			return res.status(500).json({ error: error.message });
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
			return res.status(500).json({ error: error.message });
		}
    }

    async changeProfileInfo(req, res) {
        try {
            const userId = req.user.userId;
            const { newDisplayName, newAbout, newLinks } = req.body;
            if (!newDisplayName || !newAbout || !newLinks) {
                return res.status(400).json({ message: "Please enter new display name, new about and new social links." });
            }
            const user = await User.findById(userId);
            if (!user) {
                return res.status(400).json({ message: "User not found." });
            }
            user.fullname = newDisplayName;
            user.about = newAbout;
            user.links = newLinks;
            await user.save();
            return res.status(200).json({
                newUserInfo: {
                    fullname: user.fullname,
                    about: user.about,
                    links: user.links
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
			if(!followId) {
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
}

module.exports = new UserController();
