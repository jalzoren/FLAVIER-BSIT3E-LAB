const express = require('express');
const router = express.Router();
const googleAuthController = require('../controllers/googleAuthController');

router.post('/setup', googleAuthController.setupGoogleAuth);
router.post('/verify', googleAuthController.verifyGoogleAuth);
router.post('/direct-verify', googleAuthController.directVerify);
router.get('/check-method/:userId', googleAuthController.checkAuthMethod);
router.get('/status/:userId', googleAuthController.getGoogleAuthStatus);
router.post('/disable', googleAuthController.disableGoogleAuth);
router.post('/reset', googleAuthController.resetGoogleAuth);

module.exports = router;