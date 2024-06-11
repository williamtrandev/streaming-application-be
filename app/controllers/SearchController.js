import { calculateStringSimilarity } from "../common/utils.js";
import User from "../models/User.js";

class SearchController {
    async searchUsers(req, res) {
        try {
            const { q, limit, exclude } = req.query;
            let excludedUserIds = [];
            if (exclude) {
                const currentUserMods = await User.findById(exclude, 'mods')
                    .lean()
                    .populate('mods.user', '_id');
                const modUserIds = currentUserMods.mods.map(mod => mod.user._id.toString());
                excludedUserIds = [...modUserIds, exclude];
            }
            const keywordVariations = [];
            for (let i = 1; i <= q.length; i++) {
                const variation = q.substring(0, i);
                keywordVariations.push(variation);
            }
            const regexQueries = keywordVariations.map(key => ({
                $or: [
                    { username: { $regex: key, $options: 'i' } },
                    { fullname: { $regex: key, $options: 'i' } }
                ]
            }));
            var channels = User.find({ $or: regexQueries.flat() });
            if (excludedUserIds.length > 0) {
                channels = channels.where('_id').nin(excludedUserIds);
            }
            if(limit) {
                channels = channels.limit(limit);
            }
            channels = await channels.exec();
            const sortedChannels = channels.sort((a, b) => {
                const similarityA = calculateStringSimilarity(a.username, q) + calculateStringSimilarity(a.fullname, q);
                const similarityB = calculateStringSimilarity(b.username, q) + calculateStringSimilarity(b.fullname, q);
                return similarityB - similarityA;
            });
            return res.status(200).json({ channels: sortedChannels });
        } catch (error) {
            console.log(error)
            return res.status(500).json({ message: error.message });
        }
    }
}

export default new SearchController();
