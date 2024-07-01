import mongoose from 'mongoose';

const { Schema } = mongoose;

const BannedSchema = new Schema({
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
	typeBanned: {
		type: String,
		default: 'watch'
	}
}, { timestamps: true });

const Banned = mongoose.model('Banned', BannedSchema);

export default Banned;
