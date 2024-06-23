import express from 'express';
import { verifyToken } from '../app/middlewares/verifyToken.js';
import authController from '../app/controllers/AuthController.js';

const router = express.Router();

// router.post('/verify-otp', authController.verifyOTP);
router.post('/login', authController.login);
router.post('/refresh', authController.refreshToken);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.post('/register', authController.register);
router.post('/send-verify-email', authController.sendVerifyEmail);
router.post('/check/username-available', authController.checkUsernameAvailable);
router.post('/check/email-available', authController.checkEmailAvailable);
router.put('/change-password', verifyToken, authController.changePassword);
router.put('/change-username', verifyToken, authController.changeUsername);
router.put('/change-email', verifyToken, authController.changeEmail);
router.post('/forgot-username', authController.forgotUsername);

export default router;
