import logger from "../common/logger.js";
import { FETCH_LIMIT } from "../constants/index.js";
import Follower from "../models/Follower.js";
import History from "../models/History.js";
import Stream from "../models/Stream.js";
import User from "../models/User.js";

class StreamController {
    async getSavedStreams(req, res) {
        try {
            const { username, page } = req.params;
            logger.info(`Start get saved stream api with username ${username}, page ${page}`);
            const user = await User.findOne({ username: username });
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
            const streams = await Stream.find({ user: user._id, duration: { $gt: 0 } })
                .skip((page - 1) * FETCH_LIMIT)
                .limit(FETCH_LIMIT);
            return res.status(200).json({ streams });
        } catch (error) {
            logger.error("Call get saved streams api error: " + error);
            return res.status(500).json({ message: error.message });
        }
    }

    async getStreamerHomeStreams(req, res) {
        try {
            const { username } = req.params;
            logger.info("Start get streamer home api with username " + username);
            const user = await User.findOne({ username: username });
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
            const mostViewedStreams = await Stream.find({ user: user._id, duration: { $gt: 0 } })
                .sort({ numViews: -1 }).limit(20);
            const mostLikedStreams = await Stream.find({ user: user._id, duration: { $gt: 0 } })
                .sort({ numLikes: -1 }).limit(20);
            const currentStream = await Stream.findOne({ user: user._id, started: true, duration: 0 })
                .populate({
                    path: "user",
                    select: "username fullname profilePicture"
                });
            return res.status(200).json({
                mostViewedStreams,
                mostLikedStreams,
                currentStream
            });
        } catch (error) {
            logger.error("Call get streamer home api error: " + error);
            return res.status(500).json({ message: error.message });
        }
    }

    async getViewedStreams(req, res) {
        try {
            const userId = req.user.userId;
            const { page } = req.params;
            logger.info(`Start get viewed streams with userId ${userId}, page ${page}`);
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
            logger.error("Call get viewed streams api error: " + error);
            return res.status(500).json({ message: error.message });
        }
    }

    async getLikedStreams(req, res) {
        try {
            const userId = req.user.userId;
            const { page } = req.params;
            logger.info(`Start get liked streams api with userId ${userId}, page ${page}`);
            const histories = await History.find({ user: userId, liked: true })
                .populate({
                    path: "stream",
                    populate: {
                        path: "user",
                        select: "username profilePicture fullname"
                    }
                })
                .skip((page - 1) * FETCH_LIMIT)
                .limit(FETCH_LIMIT);
            if (!histories) {
                return res.status(500).json({ message: "Fail to get liked streams" });
            }
            // const streams = histories.map(history => history.stream);
            return res.status(200).json({
                histories
            });
        } catch (error) {
            logger.error("Call get liked streams api error: " + error);
            return res.status(500).json({ message: error.message });
        }
    }

    async getFollowingStreams(req, res) {
        try {
            const userId = req.user.userId;
            const { page } = req.params;
            logger.info(`Start get following streams with userId ${userId}, page ${page}`);
            const followedStreamers = await Follower.find({ user: userId }).select('streamer');
            const streamerIds = followedStreamers.map(follow => follow.streamer);
            const streams = await Stream.find({ user: { $in: streamerIds } })
                .populate({
                    path: "user",
                    select: "username fullname profilePicture"
                })
                .skip((page - 1) * FETCH_LIMIT)
                .limit(FETCH_LIMIT);
            return res.status(200).json({
                streams
            });
        } catch (error) {
            logger.error("Call get following streams api error: " + error);
            return res.status(500).json({ message: error.message });
        }
    }
}

export default new StreamController();
