import express from 'express';
import { verifyToken } from '../app/middlewares/verifyToken.js';
import userController from '../app/controllers/UserController.js';

const router = express.Router();

router.put('/change-profile-picture', verifyToken, userController.changeProfilePicture);
router.put('/change-profile-banner', verifyToken, userController.changeProfileBanner);
router.put('/change-profile-info', verifyToken, userController.changeProfileInfo);
router.post('/follow', verifyToken, userController.follow);
router.get('/profile/:userId', userController.getProfile);
router.get('/mini-profile/:userId', userController.getMiniProfile);
router.put('/change-links', verifyToken, userController.changeLinks);
router.get('/email/:userId', userController.getEmail);
router.get('/followed-channels', verifyToken, userController.getFollowedChannels);
router.get('/channel/:username', userController.getStreamerProfile);
router.get('/about/:username', userController.getStreamerABout);
router.get('/follow/:userId/:streamerId', userController.getFollow);
router.put('/notification', verifyToken, userController.toggleNotification);
router.delete('/unfollow/:streamerId', verifyToken, userController.unfollow);

export default router;
