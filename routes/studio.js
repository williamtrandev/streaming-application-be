import express from 'express';
import { verifyToken } from '../app/middlewares/verifyToken.js';
import studioController from '../app/controllers/StudioController.js';

const router = express.Router();

router.post('/stream', verifyToken, studioController.saveStream);
router.post('/notification', verifyToken, studioController.saveNotification);
router.get('/notification', verifyToken, studioController.getNotification);
// router.post('/stream/token', verifyToken, studioController.generateTokenStream);
router.get('/stream/:streamId', studioController.getDetailStream);
router.put('/stream/:streamId', verifyToken, studioController.editStream);
router.delete('/stream/:streamId', verifyToken, studioController.deleteStream);
router.put('/stream/:streamId/start', verifyToken, studioController.startStream);
router.put('/stream/:streamId/end/:egressId', verifyToken, studioController.endStream);
router.get('/coming-streams', verifyToken, studioController.getAllComingStreams);
router.get('/mod', verifyToken, studioController.getAllMods);
router.post('/mod', verifyToken, studioController.addMod);
router.delete('/mod/:modId', verifyToken, studioController.deleteMod);
router.get('/stream-key/:username/:streamId', verifyToken, studioController.getServerUrlAndStreamKey);
router.post('/streamer-token', verifyToken, studioController.getStreamerToken);
router.post('/viewer-token', verifyToken, studioController.getViewerToken);
router.get('/record/:streamId', verifyToken, studioController.getVideoRecord);

export default router;
