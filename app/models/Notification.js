import mongoose from 'mongoose';

const { Schema } = mongoose;

const NotificationSchema = new Schema({
	user: {
		type: Schema.Types.ObjectId,
		ref: 'User',
	},
	streamer: {
		type: Schema.Types.ObjectId,
		ref: 'User',
	},
	stream: {
		type: Schema.Types.ObjectId,
		ref: 'Stream',
	},
	// content: {
	// 	type: String
	// },
	read: {
		type: Boolean,
		default: false
	}
}, { timestamps: true });

const Notification = mongoose.model('Notification', NotificationSchema);

export default Notification;
