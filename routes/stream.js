import express from 'express';
import { verifyToken } from '../app/middlewares/verifyToken.js';
import streamController from '../app/controllers/StreamController.js';

const router = express.Router();

router.get("/history/:page", verifyToken, streamController.getViewedStreams);
router.get("/liked/:page", verifyToken, streamController.getLikedStreams);
router.get("/saved/:username/:page", streamController.getSavedStreams);
router.get("/home/:username", streamController.getStreamerHomeStreams);
router.get("/following/:page", verifyToken, streamController.getFollowingStreams);
router.get("/likes-dislikes/:streamId", streamController.getNumLikesAndDislikes);
router.get("/home", streamController.getHomeStreams);

export default router;
