class AuthController {
	home(req, res, next) {
		return res.status(200).json({ hi: "HI" });
	}
}

module.exports = new AuthController;