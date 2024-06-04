const express = require('express');
const router = express.Router();
// const { verifyToken } = require('../app/middlewares/verifyToken');
const studioController = require('../app/controllers/StudioController');

router.post('/stream', studioController.saveStream);
module.exports = router;
