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
		default: "http://localhost:3000/profile-picture/user.jpg"
	},
	profileBanner: {
		type: String,
		default: "http://localhost:3000/profile-banner/user.jpg"
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

// Tạo text index
UserSchema.index({ username: 'text', fullname: 'text' });

const User = mongoose.model('User', UserSchema);

export default User;
