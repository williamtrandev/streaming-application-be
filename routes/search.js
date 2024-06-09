import express from 'express';
import searchController from '../app/controllers/SearchController.js';

const router = express.Router();

router.get('/user', searchController.searchChannels);
router.get('/stream', searchController.searchStreams);

export default router;
