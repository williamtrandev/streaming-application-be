import express from 'express';
import { verifyToken } from '../app/middlewares/verifyToken.js';
import streamController from '../app/controllers/StreamController.js';

const router = express.Router();

// router.get("/history/:userId/:page", streamController.getViewedStreams);
router.get("/liked/:userId/:page", streamController.getLikedStreams);
router.get("/saved/:username/:page", streamController.getSavedStreams);
router.get("/home/:username", streamController.getStreamerHomeStreams);
router.get("/following/:userId/:page", streamController.getFollowingStreams);
router.get("/likes-dislikes/:streamId", streamController.getNumLikesAndDislikes);
router.get("/home", streamController.getHomeStreams);

export default router;
