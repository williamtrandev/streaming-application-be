import express from 'express';
import { verifyToken } from '../app/middlewares/verifyToken.js';
import streamController from '../app/controllers/StreamController.js';

const router = express.Router();

router.get("/history/:page", verifyToken, streamController.getViewedStream);
router.get("/liked/:page", verifyToken, streamController.getLikedStream);
router.get("/saved/:username/:page", streamController.getSavedStreams);
router.get("/home/:username", streamController.getStreamerHomeStreams);

export default router;
