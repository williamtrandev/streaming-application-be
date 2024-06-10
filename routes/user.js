import express from 'express';
import { verifyToken } from '../app/middlewares/verifyToken.js';
import userController from '../app/controllers/UserController.js';
import uploadProfilePicture from '../app/middlewares/uploadProfilePicture.js';
import uploadProfileBanner from '../app/middlewares/uploadProfileBanner.js';

const router = express.Router();

router.put('/change-profile-picture', verifyToken, uploadProfilePicture.single('file'), userController.changeProfilePicture);
router.put('/change-profile-banner', verifyToken, uploadProfileBanner.single('file'), userController.changeProfileBanner);
router.put('/change-profile-info', verifyToken, userController.changeProfileInfo);
router.post('/follow', verifyToken, userController.follow);
router.get('/profile/:userId', userController.getProfile);
router.get('/mini-profile/:userId', userController.getMiniProfile);
router.put('/change-links', verifyToken, userController.changeLinks);
router.get('/email/:userId', userController.getEmail);
router.get('/followed-channels', verifyToken, userController.getFollowedChannels);
router.get('/channel/:username', userController.getStreamerProfile);
router.get('/about/:username', userController.getStreamerABout);

export default router;
