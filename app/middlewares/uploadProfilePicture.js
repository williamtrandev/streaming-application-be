import multer from "multer";

/* FILE STORAGE */
const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		const uploadPath = "public/profile-picture";
		cb(null, uploadPath);
	},
	filename: (req, file, cb) => {
		const userId = req.user.userId;
		const date = new Date();
    	const timestamp = `${date.getFullYear()}${date.getMonth() + 1}${date.getDate()}_${date.getHours()}${date.getMinutes()}${date.getSeconds()}`;
		const filename = `${userId}_${timestamp}.jpg`;
		cb(null, filename);
	},
});

const uploadProfilePicture = multer({ storage });

export default uploadProfilePicture;
