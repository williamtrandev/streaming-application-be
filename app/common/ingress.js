import { IngressAudioEncodingPreset, IngressClient, IngressInput, IngressVideoEncodingPreset, RoomServiceClient, TrackSource } from "livekit-server-sdk";

const roomService = new RoomServiceClient(
    process.env.LIVEKIT_API_URL,
    process.env.LIVEKIT_API_KEY,
    process.env.LIVEKIT_API_SECRET
);

const ingressClient = new IngressClient(
    process.env.LIVEKIT_API_URL
    // process.env.LIVEKIT_API_KEY,
    // process.env.LIVEKIT_API_SECRET
);

export const resetIngresses = async (hostId) => {
    const ingresses = await ingressClient.listIngress({ roomName: hostId });
    const rooms = await roomService.listRooms([hostId]);
    // console.log(rooms);
    // try {
    for (const room of rooms) {
        await roomService.deleteRoom(room.name);
    }
    for (const ingress of ingresses) {
        if (ingress.ingressId) {
            await ingressClient.deleteIngress(ingress.ingressId);
        }
    }
    // } catch (error) {
    //     console.log(error);
    // }
}

export const createIngress = async (streamId, username) => {
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
    return ingress;
}
