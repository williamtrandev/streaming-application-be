const Mongoose = require('mongoose');

const { Schema } = Mongoose;

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

module.exports = Mongoose.model('History', HistorySchema);