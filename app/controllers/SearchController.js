// import { calculateStringSimilarity } from "../common/utils.js";
import { FETCH_LIMIT } from "../constants/index.js";
import History from "../models/History.js";
import Stream from "../models/Stream.js";
import User from "../models/User.js";
import { Types } from "mongoose";

class SearchController {
    async searchChannels(req, res) {
        try {
            const key = req.query.key;
            // if (key.length > 1) {
            //     const keywordVariations = [];
            //     for (let i = 2; i <= key.length; i++) {
            //         const variation = key.substring(0, i);
            //         keywordVariations.push(variation);
            //     }
            //     const regexQueries = keywordVariations.map(key => ({
            //         $or: [
            //             { username: { $regex: key, $options: 'i' } },
            //             { fullname: { $regex: key, $options: 'i' } }
            //         ]
            //     }));
            //     const channels = await User.find({ $or: regexQueries.flat() }).select("profilePicture username fullname")
            //     const sortedChannels = channels.sort((a, b) => {
            //         const similarityA = calculateStringSimilarity(a.username, key) + calculateStringSimilarity(a.fullname, key);
            //         const similarityB = calculateStringSimilarity(b.username, key) + calculateStringSimilarity(b.fullname, key);
            //         return similarityB - similarityA;
            //     });
            //     return res.status(200).json({ channels: sortedChannels });
            // } else {
            const channels = await User.find({
                $or: [
                    { username: { $regex: key, $options: 'i' } },
                    { fullname: { $regex: key, $options: 'i' } }
                ]
            }).sort({ numViews: -1 });
            return res.status(200).json({ channels: channels });
            // }
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    }

    async searchStreams(req, res) {
        try {
            const { key, page } = req.query;
            // if (key.length > 1) {
            //     const keywordVariations = [];
            //     for (let i = 2; i <= key.length; i++) {
            //         const variation = key.substring(0, i);
            //         keywordVariations.push(variation);
            //     }
            //     const regexQueries = keywordVariations.map(key => ({
            //         title: { $regex: key, $options: 'i' }
            //     }));
            //     const streams = await Stream.find({ $or: [...regexQueries.flat(), { tags: { $in: [key] } }] })
            //         .populate({
            //             path: 'user',
            //             select: 'username fullname profilePicture'
            //         })
            //         .sort({ numViews: -1 });
            //     const sortedStreams = streams.sort((a, b) => {
            //         const similarityA = calculateStringSimilarity(a.title, key);
            //         const similarityB = calculateStringSimilarity(b.title, key);
            //         return similarityB - similarityA;
            //     });
            //     return res.status(200).json({ streams: sortedStreams });
            // } else {
            const streams = await Stream.find({
                $or: [
                    { title: { $regex: key, $options: 'i' } },
                    { tags: { $in: [key] } }
                ]
            }).sort({ numViews: -1 })
                .skip((page - 1) * FETCH_LIMIT)
                .limit(FETCH_LIMIT);
            return res.status(200).json({ streams: streams });
            // }
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    }

    async searchHistory(req, res) {
        try {
            const userId = req.user.userId;
            const { key, page } = req.query;
            const searchedHistory = await History.aggregate([
                {
                    $match: {
                        user: Types.ObjectId.createFromHexString(userId)
                    }
                },
                {
                    $lookup: {
                        from: 'streams',
                        localField: 'stream',
                        foreignField: '_id',
                        as: 'streamInfo'
                    }
                },
                {
                    $unwind: '$streamInfo'
                },
                {
                    $match: {
                        $or: [
                            { 'streamInfo.title': { $regex: key, $options: 'i' } },
                            { 'streamInfo.tags': { $in: [key] } }
                        ]
                    }
                },
                {
                    $project: {
                        _id: 1,
                        user: 1,
                        stream: 1,
                        liked: 1,
                        'streamInfo.title': 1,
                        'streamInfo.tags': 1,
                        'streamInfo.previewImage': 1,
                        'streamInfo.numViews': 1,
                        'streamInfo.dateStream': 1
                    }
                },
                {
                    $skip: (page - 1) * FETCH_LIMIT
                },
                {
                    $limit: FETCH_LIMIT
                }
            ]);
            return res.status(200).json({ histories: searchedHistory });
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    }
}

export default new SearchController();
