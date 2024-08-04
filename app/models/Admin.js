import mongoose from 'mongoose';

const { Schema } = mongoose;

const AdminSchema = new Schema({
	email: {
		type: String,
		unique: true,
	},
	username: {
		type: String,
		unique: true,
		required: true
	},
	password: {
		type: String,
		required: true
	}
}, { timestamps: true });

const Admin = mongoose.model('Admin', AdminSchema);

export default Admin;