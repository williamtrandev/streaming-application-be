const express = require('express');
const router = express.Router();
const { verifyToken } = require('../app/middlewares/verifyToken');
const studioController = require('../app/controllers/StudioController');

router.post('/stream', verifyToken, studioController.saveStream);
router.post('/notification', verifyToken, studioController.saveNotification);
router.get('/notification', verifyToken, studioController.getNotification);
module.exports = router;
