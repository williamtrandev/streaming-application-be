const express = require('express');
const router = express.Router();
// const { verifyToken } = require('../app/middlewares/verifyToken');
const chatController = require('../app/controllers/ChatController');

router.post('/message', chatController.sendMessage);
module.exports = router;
