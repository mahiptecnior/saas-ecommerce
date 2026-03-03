const express = require('express');
const router = express.Router();
const publicController = require('../controllers/publicController');

// Define API routes that do NOT require authentication or tenant lookup
router.get('/plans', publicController.getActivePlans);

module.exports = router;
