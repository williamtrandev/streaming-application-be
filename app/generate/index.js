import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();
import { generateUsers } from "./users.js";
import { generateStream } from "./streams.js";
import User from "../models/User.js";
import bcrypt from 'bcrypt';
import { getObjectURL, putImageObject } from "../common/s3.js";

(async () => {
	try {
		await mongoose.connect(process.env.MONGO_URI, {
			useNewUrlParser: true,
			useUnifiedTopology: true,
		});
		console.log("DB connected successfully");
		const getImageBase64 = async (imageUrl) => {
			try {
				const response = await fetch(imageUrl);
				if (!response.ok) {
					throw new Error(`Failed to fetch image: ${response.statusText}`);
				}
				const buffer = Buffer.from(await response.arrayBuffer());
				const base64 = buffer.toString('base64');
				const mimeType = response.headers.get('content-type');
				return `data:${mimeType};base64,${base64}`;
			} catch (error) {
				console.error("Error fetching image:", error);
				throw error;
			}
		};
		// await generateStream(50, 100);
		const profilePicUrl = "https://picsum.photos/360/360";
		const profileBannerUrl = "https://picsum.photos/900/180";
		const profilePictureBase64 = await getImageBase64(profilePicUrl);
		const profileBannerBase64 = await getImageBase64(profileBannerUrl);
		const profilePicType = profilePictureBase64.split(';')[0].split('/')[1];
		const profileBannerType = profileBannerBase64.split(';')[0].split('/')[1];

		const profilePicKey = `profile_picture/default.${profilePicType}`;
		const profileBannerKey = `profile_banner/default.${profileBannerType}`;
		await putImageObject(profilePicKey, Buffer.from(profilePictureBase64.replace(/^data:image\/\w+;base64,/, ""), 'base64'));
		await putImageObject(profileBannerKey, Buffer.from(profileBannerBase64.replace(/^data:image\/\w+;base64,/, ""), 'base64'));

		
		const users = await User.find({}).select('_id'); 

		const bulkOps = users.map(user => ({
			updateOne: {
				filter: { _id: user._id },
				update: { $set: { 
					profilePictureS3: {
						key: profilePicKey,
						contentType: `image/${profilePicType}`
					},
					profileBannerS3: {
						key: profileBannerKey,
						contentType: `image/${profileBannerType}`
					}
				} }
			}
		}));

		// Thực hiện các thao tác cập nhật
		const result = await User.bulkWrite(bulkOps);
		console.log("Generation completed");
	} catch (error) {
		console.error("DB connection failed:", error);
	} finally {
		mongoose.connection.close(); 
	}
})();
