import express from 'express';
import searchController from '../app/controllers/SearchController.js';

const router = express.Router();

router.get('/user', searchController.search);

export default router;
