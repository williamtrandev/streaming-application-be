import express from 'express';
import { verifyToken } from '../app/middlewares/verifyToken.js';
import userController from '../app/controllers/UserController.js';
import uploadProfilePicture from '../app/middlewares/uploadProfilePicture.js';
import uploadProfileBanner from '../app/middlewares/uploadProfileBanner.js';

const router = express.Router();

router.put('/change-profile-picture', verifyToken, uploadProfilePicture.single('file'), userController.changeProfilePicture);
router.put('/change-profile-banner', verifyToken, uploadProfileBanner.single('file'), userController.changeProfileBanner);
router.put('/change-display-name', verifyToken, userController.changeDisplayName);

router.post('/follow', verifyToken, userController.follow);
router.get('/followed-channels', verifyToken, userController.getFollowedChannels);

export default router;
