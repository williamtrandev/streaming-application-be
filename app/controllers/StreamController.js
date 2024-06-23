import { getObjectURL } from "../common/s3.js";
import { FETCH_LIMIT } from "../constants/index.js";
import Follower from "../models/Follower.js";
import History from "../models/History.js";
import Stream from "../models/Stream.js";
import User from "../models/User.js";

class StreamController {
    async getSavedStreams(req, res) {
        try {
            const { username, page } = req.params;
            const user = await User.findOne({ username: username });
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
            const streams = await Stream.find({ user: user._id, duration: { $gt: 0 } })
                .skip((page - 1) * FETCH_LIMIT)
                .limit(FETCH_LIMIT)
                .lean();
            for (const stream of streams) {
                stream.previewImage = await getObjectURL(stream.s3?.key, stream.s3?.contentType);
            }
            return res.status(200).json({ streams });
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    }

    async getStreamerHomeStreams(req, res) {
        try {
            const { username } = req.params;
            const user = await User.findOne({ username: username });
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
            const mostViewedStreams = await Stream.find({ user: user._id, duration: { $gt: 0 } })
                .sort({ numViews: -1 }).limit(20).lean();
            for (const stream of mostViewedStreams) {
                stream.previewImage = await getObjectURL(stream.s3?.key, stream.s3?.contentType);
            }
            const mostLikedStreams = await Stream.find({ user: user._id, duration: { $gt: 0 } })
                .sort({ numLikes: -1 }).limit(20).lean();
            for (const stream of mostLikedStreams) {
                stream.previewImage = await getObjectURL(stream.s3?.key, stream.s3?.contentType);
            }
            const currentStream = await Stream.findOne({ user: user._id, started: true, duration: 0 })
                .populate({
                    path: "user",
                    select: "username fullname"
                }).lean();
            currentStream.previewImage = await getObjectURL(currentStream.s3?.key, currentStream.s3?.contentType);
            return res.status(200).json({
                mostViewedStreams,
                mostLikedStreams,
                currentStream
            });
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    }

    async getViewedStreams(req, res) {
        try {
            const userId = req.user.userId;
            const { page } = req.params;
            const histories = await History.find({ user: userId })
                .populate("stream")
                .skip((page - 1) * FETCH_LIMIT)
                .limit(FETCH_LIMIT);
            if (!histories) {
                return res.status(500).json({ message: "Fail to get history" });
            }
            // const streams = histories.map(history => history.stream);
            return res.status(200).json({
                histories
            });
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    }

    async getLikedStreams(req, res) {
        try {
            const userId = req.user.userId;
            const { page } = req.params;
            const histories = await History.find({ user: userId, liked: true })
                .populate({
                    path: "stream",
                    populate: {
                        path: "user",
                        select: "username profilePictureS3 fullname"
                    }
                })
                .skip((page - 1) * FETCH_LIMIT)
                .limit(FETCH_LIMIT)
                .lean();
            for (const history of histories) {
                history.stream.previewImage = await getObjectURL(
                    history.stream.s3.key,
                    history.stream.s3.contentType
                );
                history.stream.user.profilePicture = await getObjectURL(
                    history.stream.user.profilePictureS3?.key,
                    history.stream.user.profilePictureS3?.contentType
                );
            }
            // const streams = histories.map(history => history.stream);
            return res.status(200).json({
                histories
            });
        } catch (error) {
            console.log(error);
            return res.status(500).json({ message: error.message });
        }
    }

    async getFollowingStreams(req, res) {
        try {
            const userId = req.user.userId;
            const { page } = req.params;
            const followedStreamers = await Follower.find({ user: userId }).select('streamer');
            const streamerIds = followedStreamers.map(follow => follow.streamer);
            const streams = await Stream.find({ user: { $in: streamerIds } })
                .populate({
                    path: "user",
                    select: "username fullname profilePictureS3"
                })
                .skip((page - 1) * FETCH_LIMIT)
                .limit(FETCH_LIMIT)
                .lean();
            for (const stream of streams) {
                stream.previewImage = await getObjectURL(stream.s3?.key, stream.s3?.contentType);
                const profilePicture = await getObjectURL(
                    stream.user.profilePictureS3?.key,
                    stream.user.profilePictureS3?.contentType
                );
                stream.user.profilePicture = profilePicture;
            }
            return res.status(200).json({
                streams
            });
        } catch (error) {
            console.log(error)
            return res.status(500).json({ message: error.message });
        }
    }

    async getNumLikesAndDislikes(req , res) {
        try {
            const { streamId } = req.params;
            const stream = await Stream.findById(streamId);
            if (!stream) {
                return res.status(404).json({ message: "Stream not found" });
            }
            return res.status(200).json({
                numLikes: stream.numLikes,
                numDislikes: stream.numDislikes
            });
        } catch (error) {
            console.log(error)
            return res.status(500).json({ message: error.message });
        }
    }
}

export default new StreamController();
