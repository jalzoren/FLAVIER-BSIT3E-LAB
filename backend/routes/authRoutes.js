const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/login', authController.login);
router.post('/register', authController.register);
router.get('/locked-accounts', authController.getLockedAccounts);
router.put('/unlock-account/:userId', authController.unlockAccount);
router.get('/all-users', authController.getAllUsers);
router.post('/check-password', authController.checkPasswordStrength);

module.exports = router;