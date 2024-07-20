import { getObjectURL } from "../common/s3.js";
import logger from "../common/logger.js";
import { FETCH_LIMIT } from "../constants/index.js";
import Follower from "../models/Follower.js";
import History from "../models/History.js";
import Stream from "../models/Stream.js";
import User from "../models/User.js";
import { Types } from "mongoose";

class StreamController {
    async getSavedStreams(req, res) {
        try {
            const { username, page } = req.params;
            logger.info(`Start get saved stream api with username ${username}, page ${page}`);
            const user = await User.findOne({ username: username });
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
            const streams = await Stream.find({ user: user._id, finished: true, rerun: true })
                .skip((page - 1) * FETCH_LIMIT)
                .limit(FETCH_LIMIT)
                .sort({ finishAt: -1 })
                .lean();
            for (const stream of streams) {
                stream.previewImage = await getObjectURL(stream.s3?.key, stream.s3?.contentType);
                stream.duration = stream.finishAt - stream.startAt;
            }
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
            const mostViewedStreams = await Stream.find({ user: user._id, finished: true, rerun: true })
                .sort({ numViews: -1 }).limit(20).lean();
            for (const stream of mostViewedStreams) {
                stream.previewImage = await getObjectURL(stream.s3.key, stream.s3.contentType);
                stream.duration = stream.finishAt - stream.startAt;
            }
            const mostLikedStreams = await Stream.find({ user: user._id, finished: true, rerun: true })
                .sort({ numLikes: -1 }).limit(20).lean();
            for (const stream of mostLikedStreams) {
                stream.previewImage = await getObjectURL(stream.s3.key, stream.s3.contentType);
                stream.duration = stream.finishAt - stream.startAt;
            }
            const currentStream = await Stream.findOne({ user: user._id, started: true, finished: false })
                .populate({
                    path: "user",
                    select: "username fullname"
                }).lean();
            currentStream.previewImage = await getObjectURL(currentStream.s3.key, currentStream.s3.contentType);
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

    async getLikedStreams(req, res) {
        try {
            const { userId, page } = req.params;
            logger.info(`Start get liked streams api with userId ${userId}, page ${page}`);
            const histories = await History.aggregate([
                {
                    $match: {
                        user: Types.ObjectId.createFromHexString(userId),
                        liked: true
                    }
                },
                {
                    $lookup: {
                        from: 'streams',
                        localField: 'stream',
                        foreignField: '_id',
                        as: 'stream'
                    }
                },
                {
                    $unwind: '$stream'
                },
                {
                    $match: {
                        'stream.finished': true,
                        'stream.rerun': true
                    }
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'stream.user',
                        foreignField: '_id',
                        as: 'stream.user'
                    }
                },
                {
                    $unwind: '$stream.user'
                },
                {
                    $project: {
                        _id: 1,
                        user: 1,
                        liked: 1,
                        'stream._id': 1,
                        'stream.title': 1,
                        'stream.tags': 1,
                        'stream.s3': 1,
                        'stream.numViews': 1,
                        'stream.dateStream': 1,
                        'stream.started': 1,
                        'stream.finished': 1,
                        'stream.startAt': 1,
                        'stream.finishAt': 1,
                        'stream.user.username': 1,
                        'stream.user.fullname': 1,
                        'stream.user.profilePictureS3': 1
                    }
                },
                {
                    $skip: (page - 1) * FETCH_LIMIT
                },
                {
                    $limit: FETCH_LIMIT
                },
                { $sort: { updatedAt: -1 } }
            ]);
            for (const history of histories) {
                history.stream.previewImage = await getObjectURL(
                    history.stream.s3.key,
                    history.stream.s3.contentType
                );
                history.stream.user.profilePicture = await getObjectURL(
                    history.stream.user.profilePictureS3?.key,
                    history.stream.user.profilePictureS3?.contentType
                );
                if (history.stream.finished) {
                    history.stream.duration = history.stream.finishAt - history.stream.startAt;
                }
            }
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
            const { userId, page } = req.params;
            logger.info(`Start get following streams with userId ${userId}, page ${page}`);
            const followedStreamers = await Follower.find({ user: userId }).select('streamer');
            const streamerIds = followedStreamers.map(follow => follow.streamer);
            const streams = await Stream.find({ 
                user: { $in: streamerIds },
                $or: [
                    { finished: true, rerun: true },
                    { finished: false }
                ]
            })
                .populate({
                    path: "user",
                    select: "username fullname profilePictureS3"
                })
                .skip((page - 1) * FETCH_LIMIT)
                .limit(FETCH_LIMIT)
                .sort({ createAt: -1 })
                .lean();
            for (const stream of streams) {
                stream.previewImage = await getObjectURL(stream.s3?.key, stream.s3?.contentType);
                const profilePicture = await getObjectURL(
                    stream.user.profilePictureS3?.key,
                    stream.user.profilePictureS3?.contentType
                );
                stream.user.profilePicture = profilePicture;
                if (stream.finished) {
                    stream.duration = stream.finishAt - stream.startAt;
                }
            }
            return res.status(200).json({
                streams
            });
        } catch (error) {
            logger.error("Call get following streams api error: " + error);
            return res.status(500).json({ message: error.message });
        }
    }

    async getNumLikesAndDislikes(req, res) {
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
            logger.error("Call get lives and dislikes api error: " + error);
            return res.status(500).json({ message: error.message });
        }
    }

    async getHomeStreams(req, res) {
        try {
            const randomStreams = await Stream.aggregate([
                { $match: { started: true, finished: false } },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'user',
                        foreignField: '_id',
                        as: 'user',
                        pipeline: [
                            {
                                $project: {
                                    _id: 1,
                                    username: 1,
                                    fullname: 1,
                                    profilePictureS3: 1 
                                }
                            }
                        ]
                    }
                },
                { $sample: { size: 12 } },
                {
                    $unwind: '$user'
                }
            ]);
            for (const stream of randomStreams) {
                stream.previewImage = await getObjectURL(
                    stream.s3.key,
                    stream.s3.contentType
                );
                stream.user.profilePicture = await getObjectURL(
                    stream.user.profilePictureS3.key,
                    stream.user.profilePictureS3.contentType
                );
            }

            let followingStreams = [];
            let recommendStreams = [];
            const userId = req.query.userId;
            if (userId) {
                const followedStreamers = await Follower.find({ user: userId }).select('streamer');
                const streamerIds = followedStreamers.map(follow => follow.streamer);
                followingStreams = await Stream.find({ 
                    user: { $in: streamerIds },
                    $or: [
                        { finished: true, rerun: true },
                        { finished: false }
                    ]
                })
                    .populate({
                        path: "user",
                        select: "username fullname profilePictureS3"
                    })
                    .limit(6)
                    .sort({ dateStream: -1 })
                    .lean();
                for (const stream of followingStreams) {
                    stream.previewImage = await getObjectURL(
                        stream.s3.key,
                        stream.s3.contentType
                    );
                    stream.user.profilePicture = await getObjectURL(
                        stream.user.profilePictureS3.key,
                        stream.user.profilePictureS3.contentType
                    );
                    if (stream.finished) {
                        stream.duration = stream.finishAt - stream.startAt;
                    }
                }

                const recentHistories = await History.aggregate([
                    { $match: { user: Types.ObjectId.createFromHexString(userId) } },
                    { $sort: { createdAt: -1 } },
                    { $limit: 20 },
                    {
                        $lookup: {
                            from: 'streams',
                            localField: 'stream',
                            foreignField: '_id',
                            as: 'streamDetails'
                        }
                    },
                    { $unwind: '$streamDetails' },
                    { $project: { 'streamDetails.tags': 1 } }
                ]);

                // Extract tags from the results
                const historyTags = recentHistories.map(history => history.streamDetails.tags).flat();
                const tags = [...new Set(historyTags)];
                recommendStreams = await Stream.aggregate([
                    { $match: { 
                        tags: { $in: tags },
                        $or: [
                            { finished: true, rerun: true },
                            { finished: false }
                        ]
                    } },
                    {
                        $lookup: {
                            from: 'users',
                            localField: 'user',
                            foreignField: '_id',
                            as: 'user',
                            pipeline: [
                                {
                                    $project: {
                                        _id: 1,
                                        username: 1,
                                        fullname: 1,
                                        profilePictureS3: 1 
                                    }
                                }
                            ]
                        }
                    },
                    { $sample: { size: 6 } },
                    {
                        $unwind: '$user'
                    }
                ]);

                for (const stream of recommendStreams) {
                    stream.previewImage = await getObjectURL(
                        stream.s3.key,
                        stream.s3.contentType
                    );
                    stream.user.profilePicture = await getObjectURL(
                        stream.user.profilePictureS3.key,
                        stream.user.profilePictureS3.contentType
                    );
                    if (stream.finished) {
                        stream.duration = stream.finishAt - stream.startAt;
                    }
                }
            }

            return res.status(200).json({
                randomStreams,
                followingStreams,
                recommendStreams
            });
        } catch (error) {
            logger.error("Call get home streams api error: " + error);
            return res.status(500).json({ message: error.message });
        }
    }
}

export default new StreamController();
