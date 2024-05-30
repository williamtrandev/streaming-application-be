const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const StreamSchema = new Schema({
	userId: {
		type: Schema.Types.ObjectId,
		ref: 'User',
		required: true
	},
	title: {
		type: String,
		required: true,
		trim: true
	},
	description: {
		type: String,
		trim: true
	},
	dateStream: {
		type: Date,
		required: true
	},
	duration: {
		type: Number, 
		default: 0
	},
	numViewsLive: {
		type: Number,
		default: 0
	},
	numViews: {
		type: Number,
		default: 0
	},
	tags: [{
		type: String,
		trim: true
	}],
	started: {
		type: Boolean,
		default: false
	}
}, { timestamps: true });

const Stream = mongoose.model('Stream', StreamSchema);

module.exports = Stream;
