const express = require('express');
const router = express.Router();
const { verifyToken } = require('../app/middlewares/verifyToken');
const authController = require('../app/controllers/AuthController');

router.post('/register', authController.register);
router.post('/check/username_available', authController.checkUsernameAvailable);
router.post('/check/email_available', authController.checkEmailAvailable);

router.post('/verify-otp', authController.verifyOTP);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
module.exports = router;
