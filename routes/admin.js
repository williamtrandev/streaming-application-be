import express from 'express';
import { verifyToken } from '../app/middlewares/verifyToken.js';
import adminController from '../app/controllers/AdminController.js';

const router = express.Router();

router.get('/action-streamer/:streamerId', adminController.actionStreamer);
router.get('/streamers/page/:page', adminController.getStreamer);
router.get('/streamers/:streamerId', adminController.getDetailStreamer);
router.get('/ban-stream/:streamId', adminController.banStream);
router.get('/overview', adminController.overview);

export default router;
