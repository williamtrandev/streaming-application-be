import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import morgan from "morgan";
import willSocket from "./socket.js";
import path from "path";
import route from './routes/index.js';
const __dirname = path.resolve();

dotenv.config();
const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: '2mb' }));
app.use(cors());
app.use(morgan('dev'));
app.use(express.static(path.join(__dirname, "public")));

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

willSocket(server);
