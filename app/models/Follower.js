const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const FollowerSchema = new Schema({
	user: {
		type: Schema.Types.ObjectId,
		ref: 'User',
		required: true
	},
	follower: {
		type: Schema.Types.ObjectId,
		ref: 'User',
		required: true
	},
	receiveNotification: {
		type: Boolean,
		default: false
	}
}, { timestamps: true });

const Follower = mongoose.model('Follower', FollowerSchema);

module.exports = Follower;
