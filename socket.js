const socket = require("socket.io");
const User = require("./app/models/User");
const Stream = require("./app/models/Stream");

const willSocket = (server) => {
	
	const io = socket(server, {
		cors: {
			origin: process.env.ORIGIN,
			credentials: true
		}
	})
	const rooms = {};
	const userToSocketMap = new Map();
	const socketToUserMap = new Map();
	io.on("connection", async (socket) => {
		socket.on("logged", (userId) => {
			console.log("User logged", userId);
			userToSocketMap.set(userId, socket.id);
			socketToUserMap.set(socket.id, userId);
			console.log("userToSocketMap", userToSocketMap);
			console.log("socketToUserMap", socketToUserMap);
		})
		socket.on("joinRoom", (streamId, userId) => {
			socket.join(streamId);
			console.log(socket.rooms);
			if (!rooms[streamId]) {
				rooms[streamId] = new Set();
			}
			rooms[streamId].add(socket.id);
			console.log("User joined");
			console.log(rooms);
		});
		socket.on("sendMessage", (data) => {
			console.log(data);
			const { streamId, userId, content, duration } = data;
			console.log(rooms[streamId])
			io.to(streamId).emit("newMessage", { userId: userId, content });
			console.log("Sent message");
		});
		socket.on("sendNotification", async (data) => {
			const { stream, userId } = data;
			const user = await User.findById(userId);
			if(!user) return;
			const followsId = user.follows
				.filter(follow => follow.receiveNotification)
				.map(usr => usr.user.toString());
			const socketIds = followsId.map(followId => userToSocketMap.get(followId));
			console.log("Send notification", userId, socketIds, stream);
			const notification = {
				...stream,
				username: user.username,
				fullname: user.fullname,
				profilePicture: user.profilePicture
			};
			io.to(socketIds).emit("receiveNotification", notification);
		})
		socket.on('disconnect', () => {
			console.log(`Client disconnected: ${socket.id}`);
			Object.keys(rooms).forEach((room) => {
				if (rooms[room].has(socket.id)) {
					rooms[room].delete(socket.id);
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
		});
	});
}

module.exports = willSocket;