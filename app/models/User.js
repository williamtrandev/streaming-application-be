import mongoose from 'mongoose';
import { ROLE_MOD, S3_PATH } from '../constants/index.js';

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
	profilePictureS3: {
		key: {
			type: String,
			default: `${S3_PATH.PROFILE_PICTURE}/default.png`
		},
		contentType: {
			type: String,
			default: 'image/png'
		}
	},
	profileBannerS3: {
		key: {
			type: String,
			default: `${S3_PATH.PROFILE_BANNER}/default.jpeg`
		},
		contentType: {
			type: String, 
			default: 'image/jpeg'
		}
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
		default: Date.now()
	},
	mods: [ModSchema],
	numBans: {
		type: Number,
		default: 0
	}
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);

export default User;
