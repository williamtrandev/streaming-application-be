import express from 'express';
import chatController from '../app/controllers/ChatController.js';
import { verifyToken } from '../app/middlewares/verifyToken.js';

const router = express.Router();

router.post('/message', verifyToken, chatController.sendMessage);
router.get('/message/:streamId', chatController.getAllMessages);

export default router;
