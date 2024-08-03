import express from 'express';
import { verifyToken } from '../app/middlewares/verifyToken.js';
import adminController from '../app/controllers/AdminController.js';

const router = express.Router();

router.get('/action-streamer/:streamerId', verifyToken, adminController.actionStreamer);
router.get('/streamers/page/:page', verifyToken, adminController.getStreamer);
router.get('/streamers/:streamerId', verifyToken, adminController.getDetailStreamer);
router.get('/ban-stream/:streamId', verifyToken, adminController.banStream);
router.get('/overview', verifyToken, adminController.overview);
router.post('/login', adminController.login);
router.get('/', verifyToken, adminController.getSettings);
router.put('/email', verifyToken, adminController.changeEmail);
router.put('/password', verifyToken, adminController.changePassword);
router.put('/username', verifyToken, adminController.changeUsername);

export default router;
