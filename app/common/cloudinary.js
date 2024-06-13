import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
dotenv.config();

class CloudinaryService {
	constructor() {
		if (!CloudinaryService.instance) {
			cloudinary.config({
				cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
				api_key: process.env.CLOUDINARY_API_KEY,
				api_secret: process.env.CLOUDINARY_API_SECRET
			});

			CloudinaryService.instance = this;
		}

		return CloudinaryService.instance;
	}

	async uploadImage(image, folder) {
		try {
			const uploadResult = await cloudinary.uploader.upload(image, { folder: folder });
			return uploadResult;
		} catch (error) {
			console.error("Error uploading image:", error);
			throw error;
		}
	}

	async deleteImage(publicId) {
		try {
			const result = await cloudinary.uploader.destroy(publicId);
			return result;
		} catch (error) {
			console.error('Lỗi khi xóa hình ảnh:', error);
			throw error;
		}
	}

	getOptimizedUrl(publicId) {
		return cloudinary.url(publicId, {
			fetch_format: 'auto',
			quality: 'auto'
		});
	}

	getAutoCropUrl(publicId, width = 500, height = 500) {
		return cloudinary.url(publicId, {
			crop: 'auto',
			gravity: 'auto',
			width,
			height,
		});
	}

	async deleteImage(publicId) {
		try {
			const deleteResult = await cloudinary.uploader.destroy(publicId);
			return deleteResult;
		} catch (error) {
			console.error("Error deleting image:", error);
			throw error;
		}
	}

	getInstance() {
		return this;
	}
}

const instance = new CloudinaryService();
Object.freeze(instance);

export default instance;