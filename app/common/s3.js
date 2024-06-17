import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import dotenv from 'dotenv';
dotenv.config();

let s3ClientInstance = null;

const getS3Client = () => {
	if (!s3ClientInstance) {
		console.log("INIT S3")
		s3ClientInstance = new S3Client({
			region: "ap-southeast-1",
			credentials: {
				accessKeyId: process.env.S3_ACCESS_KEY,
				secretAccessKey: process.env.S3_SECRET_KEY
			}
		});
	} else {
		console.log("HAS BEEN HANDLED")
	}
	return s3ClientInstance;
};

const getObjectURL = async (key, contentType) => {
	try {
		const s3Client = getS3Client();
		const getParams = {
			Bucket: process.env.S3_BUCKET_NAME,
			Key: key,
			ContentType: contentType
		};
		const command = new GetObjectCommand(getParams);
		const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
		return url;
	} catch (err) {
		console.error("Get Object Error", err);
		return null;
	}
}

const putImageObject = async (key, data) => {
	try {
		const s3Client = getS3Client();
		const putParams = {
			Bucket: process.env.S3_BUCKET_NAME,
			Key: key,
			Body: data,
			ContentEncoding: 'base64',
			ContentType: `image/${key.split('.')[1]}`
		};
		const command = new PutObjectCommand(putParams);
		const response = await s3Client.send(command);
		console.log("Upload Success", response);
	} catch (err) {
		console.error("Put Object Error", err);
		throw err;
	}
}

export {
	getObjectURL,
	putImageObject
}