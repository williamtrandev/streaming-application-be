import mongoose from 'mongoose';

const { Schema } = mongoose;

const FollowerSchema = new Schema({
	user: {
		type: Schema.Types.ObjectId,
		ref: 'User',
		required: true
	},
	streamer: {
		type: Schema.Types.ObjectId,
		ref: 'User',
		required: true
	},
	receiveNotification: {
		type: Boolean,
		default: true
	}
}, { timestamps: true });

const Follower = mongoose.model('Follower', FollowerSchema);

export default Follower;
