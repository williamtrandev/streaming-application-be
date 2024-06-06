const multer = require("multer");
/* FILE STORAGE */
const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		const uploadPath = "public/profile-banner";
		cb(null, uploadPath);
	},
	filename: function (req, file, cb) {
		const userId = req.user.userId;
		const date = new Date();
    	const timestamp = `${date.getFullYear()}${date.getMonth() + 1}${date.getDate()}_${date.getHours()}${date.getMinutes()}${date.getSeconds()}`;
		const filename = `${userId}_${timestamp}.jpg`;
		cb(null, filename);
	},
});
const uploadProfileBanner = multer({ storage });
module.exports = uploadProfileBanner;
