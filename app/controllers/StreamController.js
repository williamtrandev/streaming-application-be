import { FETCH_LIMIT } from "../constants/index.js";
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
                .limit(FETCH_LIMIT);
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
                .sort({ numViews: -1 }).limit(20);
            const mostLikedStreams = await Stream.find({ user: user._id, duration: { $gt: 0 } })
                .sort({ numLikes: -1 }).limit(20);
            const currentStream = await Stream.findOne({ user: user._id, started: true, duration: 0 });
            return res.status(200).json({
                mostViewedStreams,
                mostLikedStreams,
                currentStream
            });
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    }

    async getViewedStream(req, res) {
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

    async getLikedStream(req, res) {
        try {
            const userId = req.user.userId;
            const { page } = req.params;
            const histories = await History.find({ user: userId, liked: true })
                .populate("stream")
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
            return res.status(500).json({ message: error.message });
        }
    }
}

export default new StreamController();
