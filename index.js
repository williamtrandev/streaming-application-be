const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const multer = require("multer");
const morgan = require("morgan");
const socket = require("socket.io");

const route = require('./routes');

dotenv.config();
const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());
app.use(morgan('dev'));

route(app);


const PORT = process.env.PORT || 6001;
mongoose
	.connect(process.env.MONGO_URI)
	.then(() => {
		console.log("DB connect successfully");
	})
	.catch((error) => console.log(`${error} did not connect`));

const server = app.listen(PORT, () => {
	console.log(`Server Port: ${PORT}`)
});

const io = socket(server, {
	cors: {
		origin: process.env.ORIGIN,
		credentials: true
	}
})
const rooms = {};
io.on("connection", (socket) => {
	global.chatSocket = socket;
	socket.on("joinRoom", (streamId, userId) => {
		socket.join(streamId);
		if(!rooms[streamId]) {
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
})