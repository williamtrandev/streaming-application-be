import User from "../models/User.js";
import bcrypt from 'bcrypt';

export const generateUsers = async (numUsers) => {
	try {
		const firstNames = ["John", "Jane", "Michael", "Sarah", "David", "Emily", "Chris", "Jessica", "Matthew", "Ashley"];
		const lastNames = ["Smith", "Johnson", "Williams", "Jones", "Brown", "Davis", "Miller", "Wilson", "Moore", "Taylor"];
		
		const randomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];
		const randomString = (length) => Math.random().toString(36).substring(2, length + 2);

		const randomDateInLastMonth = () => {
			const now = new Date();
			const lastMonth = new Date(now.setMonth(now.getMonth() - 1));
			const randomTime = lastMonth.getTime() + Math.random() * (Date.now() - lastMonth.getTime());
			return new Date(randomTime);
		};
		const hash = await bcrypt.hash("password", 10);

		const generateRandomUser = () => {
			const firstName = randomElement(firstNames);
			const lastName = randomElement(lastNames);
			const fullName = `${firstName} ${lastName}`;
			const username = `${firstName.toLowerCase()}${lastName.toLowerCase()}${Math.floor(Math.random() * 1000)}`;
			const email = `${username}@example.com`;
			return {
				email: email,
				username: username,
				fullname: fullName,
				password: hash,
				about: randomString(50),
				links: [
					{
						title: 'My Website',
						link: `https://${randomString(10)}.com`,
					},
				],
				createdAt: randomDateInLastMonth(),
			};
		};

		const bulkUsers = Array.from({ length: numUsers }, () => generateRandomUser());
		await User.insertMany(bulkUsers);
		console.log(`${numUsers} users have been generated and inserted successfully.`);
	} catch (error) {
		console.error("An error occurred while generating users:", error);
	}
};
