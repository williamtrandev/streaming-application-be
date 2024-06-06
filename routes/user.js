const express = require('express');
const router = express.Router();
const { verifyToken } = require('../app/middlewares/verifyToken');
const userController = require('../app/controllers/UserController');
const uploadProfilePicture = require('../app/middlewares/uploadProfilePicture');
const uploadProfileBanner = require('../app/middlewares/uploadProfileBanner');

router.put('/change-profile-picture', verifyToken, uploadProfilePicture.single('file'), userController.changeProfilePicture);
router.put('/change-profile-banner', verifyToken, uploadProfileBanner.single('file'), userController.changeProfileBanner);
router.put('/change-profile-info', verifyToken, userController.changeProfileInfo);
router.post('/follow', verifyToken, userController.follow);
router.get('/profile/:userId', userController.getProfile);
router.get('/mini-profile/:userId', userController.getMiniProfile);
router.put('/change-links', verifyToken, userController.changeLinks);
router.get('/email/:userId', userController.getEmail);

module.exports = router;
