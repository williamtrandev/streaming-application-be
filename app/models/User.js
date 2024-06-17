import mongoose from 'mongoose';
import { ROLE_MOD } from '../constants/index.js';

const { Schema } = mongoose;

const ModSchema = new Schema({
	user: {
		type: Schema.Types.ObjectId,
		ref: 'User',
		required: true
	},
	role: {
		type: String,
		required: true,
		default: ROLE_MOD.BD
	},
}, { timestamps: true });

const UserSchema = new Schema({
	email: {
		type: String,
		unique: true,
		required: true
	},
	username: {
		type: String,
		unique: true,
		required: true
	},
	fullname: {
		type: String
	},
	password: {
		type: String,
		required: true
	},
	profilePicture: {
		key: String,
		contentType: String
	},
	profileBanner: {
		key: String,
		contentType: String
	},
	about: {
		type: String
	},
	links: [{
		title: String,
		link: String
	}],
	isLive: {
		type: Boolean,
		default: false
	},
	lastChangeUsername: {
		type: Date,
		default: Date.now
	},
	mods: [ModSchema]
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);

export default User;
