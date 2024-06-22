import History from "../models/History.js";

class HistoryController {
    async writeHistory(req, res) {
        try {
            const { streamId } = req.body;
            const userId = req.user.userId;
            if (!streamId) {
                return res.status(400).json({ message: 'Please enter streamId' });
            }
            const existingHistory = await History.findOne({ user: userId, stream: streamId });
            if (!existingHistory) {
                const newHistory = new History({
                    user: userId,
                    stream: streamId
                });
                await newHistory.save();
            }
            return res.status(200).json({
                message: "Write history successfully"
            });
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    }
}

export default new HistoryController();
