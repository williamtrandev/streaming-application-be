import { calculateStringSimilarity } from "../common/utils.js";
import Stream from "../models/Stream.js";
import User from "../models/User.js";

class SearchController {
    async searchChannels(req, res) {
        try {
            const key = req.query.key;
            if (key.length > 1) {
                const keywordVariations = [];
                for (let i = 2; i <= key.length; i++) {
                    const variation = key.substring(0, i);
                    keywordVariations.push(variation);
                }
                const regexQueries = keywordVariations.map(key => ({
                    $or: [
                        { username: { $regex: key, $options: 'i' } },
                        { fullname: { $regex: key, $options: 'i' } }
                    ]
                }));
                const channels = await User.find({ $or: regexQueries.flat() }).select("profilePicture username fullname")
                const sortedChannels = channels.sort((a, b) => {
                    const similarityA = calculateStringSimilarity(a.username, key) + calculateStringSimilarity(a.fullname, key);
                    const similarityB = calculateStringSimilarity(b.username, key) + calculateStringSimilarity(b.fullname, key);
                    return similarityB - similarityA;
                });
                return res.status(200).json({ channels: sortedChannels });
            } else {
                const channels = await User.find({
                    $or: [
                        { username: { $regex: key, $options: 'i' } },
                        { fullname: { $regex: key, $options: 'i' } }
                    ]
                });
                return res.status(200).json({ channels: channels });
            }
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    }

    async searchStreams(req, res) {
        try {
            const key = req.query.key;
            if (key.length > 1) {
                const keywordVariations = [];
                for (let i = 2; i <= key.length; i++) {
                    const variation = key.substring(0, i);
                    keywordVariations.push(variation);
                }
                const regexQueries = keywordVariations.map(key => ({
                    title: { $regex: key, $options: 'i' }
                }));
                const streams = await Stream.find({ $or: regexQueries.flat() })
                    .populate({
                        path: 'user',
                        select: 'username fullname profilePicture'
                    })
                    .sort({ numViews: -1 });
                const sortedStreams = streams.sort((a, b) => {
                    const similarityA = calculateStringSimilarity(a.title, key);
                    const similarityB = calculateStringSimilarity(b.title, key);
                    return similarityB - similarityA;
                });
                return res.status(200).json({ streams: sortedStreams });
            } else {
                const streams = await Stream.find({ title: { $regex: key, $options: 'i' } });
                return res.status(200).json({ streams: streams });
            }
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    }
}

export default new SearchController();
