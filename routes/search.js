import express from 'express';
import searchController from '../app/controllers/SearchController.js';
import { verifyToken } from '../app/middlewares/verifyToken.js';

const router = express.Router();

router.get('/channel', searchController.searchChannels);
router.get('/stream', searchController.searchStreams);
router.get('/history', verifyToken, searchController.searchHistory);
router.get('/user', searchController.searchUsers);
router.get('/saved-streams', verifyToken, searchController.searchSavedStream);

export default router;
