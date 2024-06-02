const express = require('express');
const router = express.Router();
const { verifyToken } = require('../app/middlewares/verifyToken');
const userController = require('../app/controllers/UserController');
const uploadProfilePicture = require('../app/middlewares/uploadProfilePicture');
const uploadProfileBanner = require('../app/middlewares/uploadProfileBanner');

router.put('/change-profile-picture', verifyToken, uploadProfilePicture.single('file'), userController.changeProfilePicture);
router.put('/change-profile-banner', verifyToken, uploadProfileBanner.single('file'), userController.changeProfileBanner);
router.put('/change-display-name', verifyToken, userController.changeDisplayName);

module.exports = router;
