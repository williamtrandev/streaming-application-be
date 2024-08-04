import express from 'express';
import { verifyToken } from '../app/middlewares/verifyToken.js';
import adminController from '../app/controllers/AdminController.js';

const router = express.Router();

router.post('/action-streamer/:streamerId', verifyToken, adminController.actionStreamer);
router.get('/streamers/page/:page', verifyToken, adminController.getStreamer);
router.get('/streamers/:streamerId', verifyToken, adminController.getDetailStreamer);
router.put('/ban-stream/:streamId', verifyToken, adminController.banStream);
router.get('/overview', verifyToken, adminController.overview);
router.post('/login', adminController.login);
router.get('/', verifyToken, adminController.getSettings);
router.put('/email', verifyToken, adminController.changeEmail);
router.put('/password', verifyToken, adminController.changePassword);
router.put('/username', verifyToken, adminController.changeUsername);
router.get('/search-streams', adminController.searchStreamsAdmin);
router.get('/stats', adminController.statsStreamersAndViewers);

export default router;
