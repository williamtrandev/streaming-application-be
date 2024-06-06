const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const NotificationSchema = new Schema({
	user: {
		type: Schema.Types.ObjectId,
		ref: 'User',
	},
	content: {
		type: String
	},
	read: {
		type: Boolean,
		default: false
	}
}, { timestamps: true });

const Notification = mongoose.model('Notification', NotificationSchema);

module.exports = Notification;
