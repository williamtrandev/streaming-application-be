const generateOTP = () => {
	return Math.floor(100000 + Math.random() * 900000).toString();
};

const containsWhitespace = (str) => {
	return /\s/.test(str);
};

const containsSpecialCharacter = (str) => {
	return /[^a-zA-Z0-9]/.test(str);
}

const isValidEmail = (email) => {
	const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return regex.test(email);
};

// Hàm tính toán độ tương đồng
const calculateStringSimilarity = (value, keyword) => {
	// Tính toán độ tương đồng ở đây, ví dụ: Levenshtein distance
	// Đây là một ví dụ đơn giản về cách tính toán độ tương đồng, bạn có thể sử dụng các phương pháp phức tạp hơn
	const distance = levenshteinDistance(value.toLowerCase(), keyword.toLowerCase());
	// Trả về ngược độ tương đồng để sắp xếp từ cao đến thấp
	return 1 / (1 + distance);
}

// Hàm tính toán khoảng cách Levenshtein
const levenshteinDistance = (str1, str2) => {
	const m = str1.length;
	const n = str2.length;
	const dp = Array.from(Array(m + 1), () => Array(n + 1).fill(0));

	for (let i = 0; i <= m; i++) {
		for (let j = 0; j <= n; j++) {
			if (i === 0) {
				dp[i][j] = j;
			} else if (j === 0) {
				dp[i][j] = i;
			} else if (str1[i - 1] === str2[j - 1]) {
				dp[i][j] = dp[i - 1][j - 1];
			} else {
				dp[i][j] = 1 + Math.min(dp[i][j - 1], dp[i - 1][j], dp[i - 1][j - 1]);
			}
		}
	}

	return dp[m][n];
}

export {
	generateOTP,
	containsWhitespace,
	containsSpecialCharacter,
	isValidEmail,
	calculateStringSimilarity
};
