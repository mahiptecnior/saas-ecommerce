const express = require('express');
const router = express.Router();
const crmController = require('../controllers/crmController');
const { authorizeTenantRole } = require('../middleware/authMiddleware');

router.get('/leads', authorizeTenantRole(['', 'admin', 'manager', 'sales']), crmController.getLeads);
router.post('/leads', authorizeTenantRole(['', 'admin', 'sales']), crmController.createLead);
router.put('/leads/:id/stage', authorizeTenantRole(['', 'admin', 'sales']), crmController.updateLeadStage);

router.get('/loyalty/:customerId', authorizeTenantRole(['', 'admin', 'sales']), crmController.getCustomerLoyalty);
router.post('/loyalty/adjust', authorizeTenantRole(['', 'admin']), crmController.adjustLoyaltyPoints);

module.exports = router;
