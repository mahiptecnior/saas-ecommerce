const express = require('express');
const router = express.Router();
const biController = require('../controllers/biController');
const { authorizeTenantRole } = require('../middleware/authMiddleware');

router.get('/health', authorizeTenantRole(['', 'admin', 'manager']), biController.getBusinessHealth);
router.get('/reports', authorizeTenantRole(['', 'admin', 'manager']), biController.getScheduledReports);
router.post('/reports', authorizeTenantRole(['', 'admin']), biController.createScheduledReport);

module.exports = router;
