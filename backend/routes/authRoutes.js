const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Public routes
router.post('/login', authController.login);
router.post('/register', authController.register);
router.post('/check-password', authController.checkPasswordStrength);

// Admin only routes
router.get('/locked-accounts', authController.getLockedAccounts);
router.put('/unlock-account/:userId', authController.unlockAccount);
router.get('/all-users', authController.getAllUsers);

module.exports = router;