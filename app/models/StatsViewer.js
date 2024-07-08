import mongoose from 'mongoose';

const { Schema } = mongoose;

const StatsViewerSchema = new Schema({
	stream: {
		type: Schema.Types.ObjectId,
		ref: 'Stream',
		required: true
	},
	numViewersPerMin: [
		{
			timestamp: {
				type: Date,
				required: true
			},
			count: {
				type: Number,
				required: true
			}
		}
	]
}, { timestamps: true });

const StatsViewer = mongoose.model('StatsViewer', StatsViewerSchema);

export default StatsViewer;
