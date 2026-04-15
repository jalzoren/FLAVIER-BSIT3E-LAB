const express = require('express');
const router = express.Router();
const otpController = require('../controllers/otpController');

// Make sure the endpoint matches what the frontend is calling
router.post('/send-email-otp', otpController.sendEmailOTP);
router.post('/verify', otpController.verifyOTP);
router.post('/resend', otpController.resendOTP);

module.exports = router;