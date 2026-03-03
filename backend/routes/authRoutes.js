const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/login', authController.login);
router.post('/register', authController.register); // Usually for tenant owners
router.put('/profile', authController.updateProfile);

module.exports = router;
