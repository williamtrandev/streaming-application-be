import mongoose from 'mongoose';

const { Schema } = mongoose;

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
		publicId: String,
		url: String
	},
	profileBanner: {
		publicId: String,
		url: String
	},
	about: {
		type: String
	},
	links: [{
		title: String,
		link: String
	}],
	lastChangeUsername: {
		type: Date,
		default: Date.now
	}
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);

export default User;
