import express from 'express';
import { verifyToken } from '../app/middlewares/verifyToken.js';
import studioController from '../app/controllers/StudioController.js';

const router = express.Router();

router.post('/stream', verifyToken, studioController.saveStream);
router.post('/notification', verifyToken, studioController.saveNotification);
router.get('/notification', verifyToken, studioController.getNotification);
router.post('/stream/token', verifyToken, studioController.generateTokenStream);

export default router;
