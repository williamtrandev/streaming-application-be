import { EgressClient, EncodedFileOutput, EncodedFileType, S3Upload, AccessToken, IngressAudioEncodingPreset, IngressClient, IngressInput, IngressVideoEncodingPreset, RoomServiceClient, TrackSource } from "livekit-server-sdk";
import redisClient from "./redis.js";
import dotenv from 'dotenv';
dotenv.config();

const generateStreamerToken = async (streamId) => {
	const token = new AccessToken(
		process.env.LIVEKIT_API_KEY,
		process.env.LIVEKIT_API_SECRET,
		{
			identity: streamId,
		}
	);
	token.addGrant({
		room: streamId,
		roomJoin: true,
		canPublish: true,
		canPublishData: true,
	});
	return await token.toJwt();
}

const generateViewerToken = async (streamId, userId) => {
	const token = new AccessToken(
		process.env.LIVEKIT_API_KEY,
		process.env.LIVEKIT_API_SECRET,
		{
			identity: userId,
		}
	);

	token.addGrant({
		room: streamId,
		roomJoin: true,
		canPublish: false,
		canPublishData: true,
	});
	return await token.toJwt();
}

const roomService = new RoomServiceClient(
    process.env.LIVEKIT_API_URL,
    process.env.LIVEKIT_API_KEY,
    process.env.LIVEKIT_API_SECRET
);

const ingressClient = new IngressClient(
    process.env.LIVEKIT_API_URL
);

const resetIngresses = async (hostId) => {
    const ingresses = await ingressClient.listIngress({ roomName: hostId });
    const rooms = await roomService.listRooms([hostId]);
    for (const room of rooms) {
        await roomService.deleteRoom(room.name);
    }
    for (const ingress of ingresses) {
        if (ingress.ingressId) {
            await ingressClient.deleteIngress(ingress.ingressId);
        }
    }
}

const createIngress = async (streamId, username) => {
	const ingressCached = await redisClient.getInstance().get(`${streamId}_ingress`);
	if(ingressCached) {
		return ingressCached;
	}

    resetIngresses(streamId);

    const options = {
        name: username,
        roomName: streamId,
        participantIdentity: streamId,
        participantName: username,
        video: {
            source: TrackSource.SCREEN_SHARE,
            preset: IngressVideoEncodingPreset.H264_1080P_30FPS_3_LAYERS
        },
        audio: {
            source: TrackSource.SCREEN_SHARE_AUDIO,
            preset: IngressAudioEncodingPreset.OPUS_STEREO_96KBPS
        }
    };

    const ingress = await ingressClient.createIngress(IngressInput.RTMP_INPUT, options);
	await redisClient.getInstance().setEx(`${streamId}_ingress`, 3600, ingress);
    return ingress;
}

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
    generateStreamerToken,
    generateViewerToken,
    createIngress
}
