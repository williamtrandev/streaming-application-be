const multer = require("multer");
/* FILE STORAGE */
const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		let uploadPath = "public/profile-banner";
		cb(null, uploadPath);
	},
	filename: function (req, file, cb) {
		const userId = req.user.userId;
		var filename = null;
		filename = `${userId}.jpg`;
		cb(null, filename);
	},
});
const uploadProfileBanner = multer({ storage });
module.exports = uploadProfileBanner;
