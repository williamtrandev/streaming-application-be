import mongoose from 'mongoose';

const { Schema } = mongoose;

const StreamSchema = new Schema({
	user: {
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
	numLikes: {
		type: Number,
		default: 0
	},
	numDislikes: {
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
	},
	rerun: {
		type: Boolean,
		default: false
	},
	s3: {
		key: String,
		contentType: String
	},
	finished: {
		type: Boolean,
		default: false
	}
}, { timestamps: true });

const Stream = mongoose.model('Stream', StreamSchema);

export default Stream;
