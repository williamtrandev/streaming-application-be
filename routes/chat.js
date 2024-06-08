import express from 'express';
import chatController from '../app/controllers/ChatController.js';

const router = express.Router();

router.post('/message', chatController.sendMessage);
router.get('/message/:streamId', chatController.getAllMessages);

export default router;
