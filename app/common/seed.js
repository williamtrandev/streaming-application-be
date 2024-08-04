import Admin from "../models/Admin.js";
import bcrypt from 'bcrypt';

const seedDB = async () => {
    try {
        const admin = await Admin.findOne();
        if (admin) {
            return;
        }

        const hash = await bcrypt.hash("admin", 10);

        const newAdmin = new Admin({
            email: null,
            username: 'admin',
            password: hash
        });

        await newAdmin.save();
        console.log('Admin created');
    } catch (err) {
        console.log(err);
    }
}

export default seedDB