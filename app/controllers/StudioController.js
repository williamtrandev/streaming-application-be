const Stream = require("../models/Stream");

class StudioController {
	async saveStream(req, res) {
		try {
			const { userId, title, description, dateStream, tags } = req.body;
			if (!userId || !title || !description || !dateStream) {
				return res.status(400).json({ message: "Please enter userId, title, description, dateStream" });
			}
			const data = await Stream.create({
				user: userId,
				title: title,
				description: description,
				dateStream: dateStream,
				tags: tags
			});
			if (!data) {
				return res.status(500).json({ message: "Failed to create stream" });
			}
			return res.status(201).json({ 
				message: "Create stream successfully",
				stream: data
			});
		} catch (error) {
			return res.status(500).json({ error: error.message });
		}
	}
}

module.exports = new StudioController();
