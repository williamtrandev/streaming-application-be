const generateOTP = () => {
	return Math.floor(100000 + Math.random() * 900000).toString();
}

const containsWhitespace = (str) => {
	return /\s/.test(str);
}

const containsSpecialCharacter = (str) => {
	return /[^a-zA-Z0-9]/.test(str);
}

const isValidEmail = (email) => {
	const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return regex.test(email);
}

module.exports = {
	generateOTP,
	containsWhitespace,
	containsSpecialCharacter,
	isValidEmail
}