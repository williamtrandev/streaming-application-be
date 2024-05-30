const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ChatSchema = new Schema({
	userId: {
		type: Schema.Types.ObjectId,
		ref: 'User',
		required: true
	},
	streamId: {
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
