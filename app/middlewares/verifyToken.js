import jwt from 'jsonwebtoken';
import logger from '../common/logger.js';

const verifyToken = async (req, res, next) => {
	try {
		logger.info("Middleware called");
		let token = req.header("Authorization");
		if (!token) {
			logger.warn("No token provided");
			return res.status(403).json({ error: "Access Denied" });
		}
		if (token.startsWith("Bearer ")) {
			token = token.substring(7, token.length).trimLeft();
		}
		logger.info("Token after Bearer removal: " + token);

		jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
			if (err) {
				logger.warn("Token verification failed: " + err.message);
				return res.status(403).json({ message: "Unauthorized" });
			}
			logger.info("Token verified successfully: " + JSON.stringify(user));
			req.user = user;
			next();
		});
	} catch (error) {
		logger.error("Error in verifyToken middleware: " + error.message);
		res.status(500).json({ error: error.message });
	}
};

export { verifyToken };
