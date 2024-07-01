// import { calculateStringSimilarity } from "../common/utils.js";
import logger from "../common/logger.js";
import { FETCH_LIMIT } from "../constants/index.js";
import History from "../models/History.js";
import Stream from "../models/Stream.js";
import User from "../models/User.js";
import { Types } from "mongoose";
import { getObjectURL } from "../common/s3.js"

class SearchController {
    async searchChannels(req, res) {
        try {
            const key = req.query.key;
            logger.info("Start search for channels api with key: " + key);
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
            })
                .select("username fullname profilePictureS3")
                .sort({ numViews: -1 })
                .lean();
            for (const channel of channels) {
                channel.profilePicture = await getObjectURL(
                    channel.profilePictureS3?.key, 
                    channel.profilePictureS3?.contentType
                );
            }
            return res.status(200).json({ channels: channels });
            // }
        } catch (error) {
            logger.error("Call search for channels api error: " + error);
            return res.status(500).json({ message: error.message });
        }
    }

    async searchStreams(req, res) {
        try {
            const { key, page } = req.query;
            logger.info(`Start search streams api with key ${key} and page ${page}`);
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
            })
                .populate({
                    path: 'user',
                    select: 'username fullname profilePictureS3'
                })
                .sort({ numViews: -1 })
                .skip((page - 1) * FETCH_LIMIT)
                .limit(FETCH_LIMIT)
                .lean();
            for (const stream of streams) {
                stream.previewImage = await getObjectURL(stream.s3?.key, stream.s3?.contentType);
                stream.user.profilePicture = await getObjectURL(
                    stream.user.profilePictureS3?.key,
                    stream.user.profilePictureS3?.contentType
                );
                if (stream.finished) {
                    stream.duration = stream.finishAt - stream.startAt;
                }
            }
            return res.status(200).json({ streams: streams });
            // }
        } catch (error) {
            logger.error("Call search streams api error: " + error);
            return res.status(500).json({ message: error.message });
        }
    }

    async searchHistory(req, res) {
        try {
            const { userId } = req.params;
            const { key, page } = req.query;
            logger.info(`Start search history api with userId ${userId}, key ${key}, page ${page}`);
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
                        'streamInfo.finished': true,
                        'streamInfo.rerun': true,
                        $or: [
                            { 'streamInfo.title': { $regex: key, $options: 'i' } },
                            { 'streamInfo.tags': { $in: [key] } }
                        ]
                    }
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'streamInfo.user',
                        foreignField: '_id',
                        as: 'streamInfo.user'
                    }
                },
                {
                    $unwind: '$streamInfo.user'
                },
                {
                    $project: {
                        _id: 1,
                        user: 1,
                        stream: 1,
                        liked: 1,
                        'streamInfo._id': 1,
                        'streamInfo.title': 1,
                        'streamInfo.tags': 1,
                        'streamInfo.s3': 1,
                        'streamInfo.numViews': 1,
                        'streamInfo.dateStream': 1,
                        'streamInfo.user.username': 1,
                        'streamInfo.user.fullname': 1,
                        'streamInfo.user.profilePictureS3': 1
                    }
                },
                {
                    $skip: (page - 1) * FETCH_LIMIT
                },
                {
                    $limit: FETCH_LIMIT
                },
                { $sort: { createdAt: -1 } }
            ]);
            for (const history of searchedHistory) {
                history.streamInfo.previewImage = await getObjectURL(
                    history.streamInfo.s3?.key, 
                    history.streamInfo.s3?.contentType
                );
                history.streamInfo.user.profilePicture = await getObjectURL(
                    history.streamInfo.user.profilePictureS3?.key, 
                    history.streamInfo.user.profilePictureS3?.contentType
                );
                if (history.streamInfo.finished) {
                    history.streamInfo.duration = history.streamInfo.finishAt - history.streamInfo.startAt;
                }
            }
            return res.status(200).json({ histories: searchedHistory });
        } catch (error) {
            logger.error("Call search history api error: " + error);
            return res.status(500).json({ message: error.message });
        }
    }

    async searchUsers(req, res) {
        try {
            const { q, limit, exclude } = req.query;
            logger.info(`Start search users api with q: ${q}, limit: ${limit}, exclude: ${exclude}`);
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
            var channels = User.find({ $or: regexQueries.flat() }, '-password');
            if (excludedUserIds.length > 0) {
                channels = channels.where('_id').nin(excludedUserIds);
            }
            if (limit) {
                channels = channels.limit(limit);
            }
            channels = await channels.exec();
            channels = await Promise.all(
                channels.map(async (channel) => {
                    const profilePictureS3 = await getObjectURL(channel.profilePictureS3.key, channel.profilePictureS3.contentType);
                    return { ...channel.toObject(), profilePictureS3 };
                })
            );
            const sortedChannels = channels.sort((a, b) => {
                const similarityA = calculateStringSimilarity(a.username, q) + calculateStringSimilarity(a.fullname, q);
                const similarityB = calculateStringSimilarity(b.username, q) + calculateStringSimilarity(b.fullname, q);
                return similarityB - similarityA;
            });
            return res.status(200).json({ channels: sortedChannels });
        } catch (error) {
            logger.error("Call search users api error: " + error);
            return res.status(500).json({ message: error.message });
        }
    }

    async searchSavedStream(req, res) {
        try {
            const userId = req.user.userId;
            const { key, page, date, numViews, numViewsLive } = req.query;
            const sorter = {
                dateStream: parseInt(date),
                numViews: parseInt(numViews),
                numViewsLive: parseInt(numViewsLive)
            };
            const streams = await Stream.find({
                user: userId,
                finished: true,
                rerun: true,
                $or: [
                    { title: { $regex: key, $options: 'i' } },
                    { tags: { $in: [key] } }
                ]
            })
                .sort(sorter)
                .skip((page - 1) * FETCH_LIMIT)
                .limit(FETCH_LIMIT)
                .lean();

            for (const stream of streams) {
                stream.previewImage = await getObjectURL(stream.s3?.key, stream.s3?.contentType);
                stream.duration = stream.finishAt - stream.startAt;
            }

            const totalStreams = await Stream.countDocuments({
                user: userId,
                $or: [
                    { title: { $regex: key, $options: 'i' } },
                    { tags: { $in: [key] } }
                ]
            });
            const numPages = Math.ceil(totalStreams / FETCH_LIMIT);
            return res.status(200).json({ streams: streams, numPages: numPages });
        } catch (error) {
            console.log(error)
            return res.status(500).json({ message: error.message });
        }
    }
}

export default new SearchController();
