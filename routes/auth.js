const express = require('express');
const router = express.Router();

const authController = require('../app/controllers/AuthController');

router.get('/', authController.home);
router.post('/register', authController.register);
router.post('/check/username_available', authController.checkUsernameAvailable);
router.post('/check/email_available', authController.checkEmailAvailable);

module.exports = router;
