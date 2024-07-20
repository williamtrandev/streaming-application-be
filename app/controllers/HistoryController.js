import History from "../models/History.js";
import Stream from "../models/Stream.js";

class HistoryController {
    async writeHistory(req, res, next) {
        try {
            const { streamId } = req.body;
            const userId = req.user.userId;
            if (!streamId) {
                return res.status(400).json({ message: 'Please enter streamId' });
            }
            const existingHistory = await History.findOne({ user: userId, stream: streamId });
            if (!existingHistory) {
                const newHistory = new History({
                    user: userId,
                    stream: streamId
                });
                const savedHistory = await newHistory.save();
                return res.status(200).json({
                    history: savedHistory
                });
            }
            return res.status(200).json({
                history: existingHistory
            });
        } catch (error) {
            next(error);
        }
    }

    async likeStream(req, res, next) {
        try {
            const { streamId, liked } = req.body;
            const userId = req.user.userId;
            if (!streamId) {
                return res.status(400).json({ message: 'Please enter streamId' });
            }

            let addLike = 0;
            let addDislike = 0;
            
            const history = await History.findOne({ user: userId, stream: streamId });
            if (!history) {
                return res.status(500).json({ message: "Like stream fail. You should try again later." });
            }
            if (liked == true) {
                if (history.liked == false) {
                    await Stream.findByIdAndUpdate(streamId, { $inc: { numLikes: 1, numDislikes: -1 } });
                    addDislike = -1;
                } else {
                    await Stream.findByIdAndUpdate(streamId, { $inc: { numLikes: 1 } });
                }
                addLike = 1;
            } else if (liked == false) {
                if (history.liked == true) {
                    await Stream.findByIdAndUpdate(streamId, { $inc: { numLikes: -1, numDislikes: 1 } });
                    addLike = -1;
                } else {
                    await Stream.findByIdAndUpdate(streamId, { $inc: { numDislikes: 1 } });
                }
                addDislike = 1;
            } else {
                if (history.liked == true) {
                    await Stream.findByIdAndUpdate(streamId, { $inc: { numLikes: -1 } });
                    addLike = -1;
                } else {
                    await Stream.findByIdAndUpdate(streamId, { $inc: { numDislikes: -1 } });
                    addDislike = -1;
                }
            }
            history.liked = liked;
            await history.save();
            return res.status(200).json({
                liked: history.liked,
                addLike,
                addDislike
            });
        } catch (error) {
            next(error);
        }
    }
}

export default new HistoryController();
