import mongoose from 'mongoose';

const { Schema } = mongoose;

const HistorySchema = new Schema({
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
	liked: {
		type: Boolean,
		default: null
	}
}, { timestamps: true });

const History = mongoose.model('History', HistorySchema);

export default History;
