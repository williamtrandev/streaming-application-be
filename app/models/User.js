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
		type: String,
		default: 'user.jpg'
	},
	profileBanner: {
		type: String,
		default: 'user.jpg'
	},
	about: {
		type: String
	},
	links: [{
		title: String,
		link: String
	}],
	verified: {
		type: Boolean,
		default: false
	},
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);

export default User;
