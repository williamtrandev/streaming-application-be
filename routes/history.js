import express from 'express';
import { verifyToken } from '../app/middlewares/verifyToken.js';
import historyController from '../app/controllers/HistoryController.js';

const router = express.Router();

router.post('/', verifyToken, historyController.writeHistory);

export default router;
