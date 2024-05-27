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
	profile_picture: {
		type: String,
		default: 'user.jpg'
	},
	profile_banner: {
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
	follow: [{
		user_id: {
			type: Schema.Types.ObjectId,
			ref: 'User',
		},
		receive_notification: Boolean
	}]
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);

module.exports = User;
