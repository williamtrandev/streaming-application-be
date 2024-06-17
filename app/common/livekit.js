import { EgressClient, EncodedFileOutput, EncodedFileType, S3Upload } from "livekit-server-sdk";
import dotenv from 'dotenv';
dotenv.config();

const startRecord = async (streamId) => {
	try {
		const egressClient = new EgressClient(
			process.env.LIVEKIT_HOST,
			process.env.LIVEKIT_API_KEY,
			process.env.LIVEKIT_API_SECRET
		);
		const output = new EncodedFileOutput({
			fileType: EncodedFileType.MP4,
			filepath: `record/${streamId}.mp4`,
			output: {
				case: 's3',
				value: new S3Upload({
					accessKey: process.env.S3_ACCESS_KEY,
					secret: process.env.S3_SECRET_KEY,
					bucket: process.env.S3_BUCKET_NAME,
				}),
			},
		});
		const info = await egressClient.startRoomCompositeEgress(streamId, { file: output });
		return info.egressId;
	} catch (err) {
		console.log("ERROR", err);
		return null;
	}
}

const endRecord = async (egressId) => {
	try {
		const egressClient = new EgressClient(
			process.env.LIVEKIT_HOST,
			process.env.LIVEKIT_API_KEY,
			process.env.LIVEKIT_API_SECRET
		);
		await egressClient.stopEgress(egressId);
	} catch (err) {
		console.log("ERROR", err);
		return null;
	}
}

export {
	startRecord,
	endRecord,
}