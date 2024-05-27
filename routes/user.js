const express = require('express');
const router = express.Router();
const { verifyToken } = require('../app/middlewares/verifyToken');
const userController = require('../app/controllers/UserController');

router.post('/follow', verifyToken, userController.follow);
module.exports = router;
