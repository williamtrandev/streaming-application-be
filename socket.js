import { Server } from "socket.io";
import User from "./app/models/User.js";
import Stream from "./app/models/Stream.js";
import Follower from "./app/models/Follower.js";
import { getObjectURL } from "./app/common/s3.js";
import { endRecord } from "./app/common/livekit.js";
import logger from "./app/common/logger.js";

const willSocket = (server) => {
	const io = new Server(server, {
		cors: {
			origin: process.env.ORIGIN,
			credentials: true
		}
	});

	const rooms = {};
	const userToSocketMap = new Map();
	const socketToUserMap = new Map();
	const socketToStreamMap = new Map();
	const socketToEgressMap = new Map();

	io.on("connection", async (socket) => {
		socket.on("logged", (userId) => {
			logger.info("User logged ", userId);
			if(userId) {
				userToSocketMap.set(userId, socket.id);
				socketToUserMap.set(socket.id, userId);
			}
			
			console.log("userToSocketMap", userToSocketMap);
			console.log("socketToUserMap", socketToUserMap);
		});

		socket.on("joinRoom", (streamId) => {
			socket.join(streamId);
			console.log(socket.rooms);
			if (!rooms[streamId]) {
				rooms[streamId] = new Set();
			}
			rooms[streamId].add(socket.id);
			console.log("User joined");
			console.log(rooms);
			io.to(streamId).emit('updateViewers', { streamId, viewers: rooms[streamId].size - 1 });
		});

		socket.on('leaveStream', (streamId) => {
			if (rooms[streamId] && rooms[streamId].has(socket.id)) {
				rooms[streamId].delete(socket.id);
				console.log(`Client ${socket.id} left room ${streamId}`);
				if (rooms[streamId].size === 0) {
					delete rooms[streamId];
				}
			}
			const userId = socketToUserMap.get(socket.id);
			if (userId) {
				userToSocketMap.delete(userId);
				socketToUserMap.delete(socket.id);
				console.log(`User leave: ${userId}`);
			}
			if(rooms[streamId]) {
				io.to(streamId).emit('updateViewers', { streamId, viewers: rooms[streamId].size - 1 });
			}
		});

		socket.on("sendMessage", async (data) => {
			console.log(data);
			const { streamId, user, content, duration, isStreamer } = data;
			console.log(rooms[streamId]);
			if (user?.profilePictureS3?.key) {
				const profilePicture = await getObjectURL(user.profilePictureS3.key, user.profilePictureS3.contentType);
				user.profilePicture = profilePicture;
			}
			io.to(streamId).emit("newMessage", { user, content, isStreamer });
			console.log("Sent message");
		});

		socket.on("sendNotification", async (data) => {
			const { stream, userId } = data;
			const user = await User.findById(userId);
			const followers = await Follower.find({ streamer: userId, receiveNotification: true });
			const followsId = followers.map(follower => follower.user.toString());
			const socketIds = [];
			followsId.forEach(followId => {
				const socketId = userToSocketMap.get(followId);
				if (socketId) {
					socketIds.push(socketId);
				}
			});
			if (socketIds.length > 0) {
				console.log("Send notification", userId, socketIds, stream);
				// const profilePicture = await getObjectURL(
				// 	user.profilePictureS3.key,
				// 	user.profilePictureS3.contentType
				// );
				const notification = {
					...stream,
					user: {
						username: user.username,
						fullname: user.fullname,
						profilePictureS3: user.profilePictureS3
					}
				};
				io.to(socketIds).emit("receiveNotification", notification);
			}
		});

		socket.on('startStream', (data) => {
			const { streamId, egressId } = data;
			console.log(`Client ${socket.id} start stream: ${streamId} - ${egressId}`);
			socketToStreamMap.set(socket.id, streamId);
			socketToEgressMap.set(socket.id, egressId);
		});

		socket.on('endStream', () => {
			console.log(`Client ${socket.id} end stream`);
			socketToStreamMap.delete(socket.id);
			socketToEgressMap.delete(socket.id);
		})

		socket.on("banned", (bannedId, streamId) => {
			logger.info(`Start socket banned event with bannedId: ${bannedId}, streamId: ${streamId}`);
			console.log(rooms)
			const stream = rooms[streamId];
			const bannedSocketId = userToSocketMap.get(bannedId);
			logger.info(`Socket event banned with stream ${stream} and banned socket id ${bannedSocketId}`);
			if(stream && stream.has(bannedSocketId)) {
				userToSocketMap.delete(bannedId);
				socketToUserMap.delete(bannedSocketId);
				io.to(bannedSocketId).emit("clientBanned")
			}
		})

		socket.on("bannedChat", (bannedId, streamId) => {
			logger.info(`Start socket banned chat event with bannedId: ${bannedId}, streamId: ${streamId}`);
			const bannedSocketId = userToSocketMap.get(bannedId);
			logger.info(`Socket event banned chat with banned socket id ${bannedSocketId}`);
			if(bannedSocketId) {
				io.to(bannedSocketId).emit("clientBannedChat");
			}
		});

		socket.on("unbannedChat", (bannedId, streamId) => {
			logger.info(`Start socket unbanned chat event with bannedId: ${bannedId}, streamId: ${streamId}`);
			const bannedSocketId = userToSocketMap.get(bannedId);
			logger.info(`Socket event unbanned chat with unbanned socket id ${bannedSocketId}`);
			if (bannedSocketId) {
				io.to(bannedSocketId).emit("clientUnbannedChat");
			}
		})

		socket.on('disconnect', async () => {
			console.log(`Client disconnected: ${socket.id}`);
			var streamId = null;
			Object.keys(rooms).forEach((room) => {
				if (rooms[room].has(socket.id)) {
					rooms[room].delete(socket.id);
					streamId = room;
					console.log(`Client ${socket.id} left room ${room}`);
					if (rooms[room].size === 0) {
						delete rooms[room];
					}
				}
			});
			const userId = socketToUserMap.get(socket.id);
			if (userId) {
				userToSocketMap.delete(userId);
				socketToUserMap.delete(socket.id);
				console.log(`User disconnected: ${userId}`);
			}
			if (rooms[streamId]) {
				io.to(streamId).emit('updateViewers', { streamId, viewers: rooms[streamId].size - 1 });
			}
			const curStreamId = socketToStreamMap.get(socket.id);
			const egressId = socketToEgressMap.get(socket.id);
			if (curStreamId) {
				console.log(`End stream: ${socket.id} - ${curStreamId} - ${egressId}`);
				const stream = await Stream.findByIdAndUpdate(curStreamId, { 
					finished: true,
					finishAt: Date.now()
				});
				const user = await User.findByIdAndUpdate(stream.user, { isLive: false });
				if(stream.rerun) {
					await endRecord(egressId);
				}
				socketToStreamMap.delete(socket.id);
				socketToEgressMap.delete(socket.id);
			}
		});
	});
};

export default willSocket;
