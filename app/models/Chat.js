const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ChatSchema = new Schema({
	user: {
		type: Schema.Types.ObjectId,
		ref: 'User',
		required: true
	},
	stream: {
		type: Schema.Types.ObjectId,
		ref: 'Stream',
		required: true
	},
	duration: {
		type: Number,
		required: true
	},
	content: String
}, { timestamps: true });

const Stream = mongoose.model('Chat', ChatSchema);

module.exports = Stream;
