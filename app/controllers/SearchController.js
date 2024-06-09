import { calculateStringSimilarity } from "../common/utils.js";
import User from "../models/User.js";

class SearchController {
    async search(req, res) {
        try {
            const key = req.query.key;
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
            const channels = await User.find({ $or: regexQueries.flat() })
            const sortedChannels = channels.sort((a, b) => {
                const similarityA = calculateStringSimilarity(a.username, key) + calculateStringSimilarity(a.fullname, key);
                const similarityB = calculateStringSimilarity(b.username, key) + calculateStringSimilarity(b.fullname, key);
                return similarityB - similarityA;
            });
            return res.status(200).json({ channels: sortedChannels });
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    }
}

export default new SearchController();
