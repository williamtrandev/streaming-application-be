const multer = require("multer");
/* FILE STORAGE */
const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		const uploadPath = "public/profile-banner";
		cb(null, uploadPath);
	},
	filename: function (req, file, cb) {
		const userId = req.user.userId;
		const filename = `${userId}.jpg`;
		cb(null, filename);
	},
});
const uploadProfileBanner = multer({ storage });
module.exports = uploadProfileBanner;
