const Mongoose = require('mongoose');

const { Schema } = Mongoose;

const HistorySchema = new Schema({
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
	liked: {
		type: Boolean,
		default: null
	}
}, { timestamps: true });

module.exports = Mongoose.model('History', HistorySchema);