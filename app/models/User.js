const mongoose = require('mongoose');
const Schema = mongoose.Schema;

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
	// verified: {
	// 	type: Boolean,
	// 	default: false
	// },
	follows: [{
		user: {
			type: Schema.Types.ObjectId,
			ref: 'User',
		},
		receiveNotification: {
			type: Boolean,
			default: false
		}
	}]
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);

module.exports = User;
