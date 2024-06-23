import mongoose from 'mongoose';

const { Schema } = mongoose;

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
	content: String,
	isStreamer: {
		type: Boolean,
		default: false
	}
}, { timestamps: true });

const Chat = mongoose.model('Chat', ChatSchema);

export default Chat;
