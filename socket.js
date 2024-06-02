const socket = require("socket.io");
const User = require("./app/models/User");

const willSocket = (server) => {
	const io = socket(server, {
		cors: {
			origin: process.env.ORIGIN,
			credentials: true
		}
	})
	const rooms = {};
	const users = {};
	io.on("connection", (socket) => {
		socket.on("joinRoom", (streamId, userId) => {
			socket.join(streamId);
			console.log(socket.rooms)
			users[userId] = socket.id;
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
		socket.on("notification", async (data) => {
			const { streamId, userId } = data;
			const user = await User.findById(userId);
			const follows = user.follows.filter(follow => follow.receiveNotification);
			
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
		});
	});
}

module.exports = willSocket;