const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const multer = require("multer");
const morgan = require("morgan");
const willSocket = require("./socket");
const path = require("path");

const route = require('./routes');

dotenv.config();
const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
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
