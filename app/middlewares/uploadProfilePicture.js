import multer from "multer";

/* FILE STORAGE */
const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		let uploadPath = "public/profile-picture";
		cb(null, uploadPath);
	},
	filename: (req, file, cb) => {
		const userId = req.user.userId;
		const filename = `${userId}.jpg`;
		cb(null, filename);
	},
});

const uploadProfilePicture = multer({ storage });

export default uploadProfilePicture;
