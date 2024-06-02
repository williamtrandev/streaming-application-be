const express = require('express');
const router = express.Router();
const { verifyToken } = require('../app/middlewares/verifyToken');
const authController = require('../app/controllers/AuthController');

router.post('/verify-otp', authController.verifyOTP);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.post('/register', authController.register);
router.post('/check/username-available', authController.checkUsernameAvailable);
router.post('/check/email-available', authController.checkEmailAvailable);
router.put('/change-password', verifyToken, authController.changePassword);
router.put('/change-username', verifyToken, authController.changeUsername);
router.put('/change-email', verifyToken, authController.changeEmail);
module.exports = router;
