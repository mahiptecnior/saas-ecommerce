const express = require('express');
const router = express.Router();
const marketingController = require('../controllers/marketingController');
const { authorizeTenantRole } = require('../middleware/authMiddleware');

router.get('/affiliates', authorizeTenantRole(['', 'admin', 'manager', 'marketing']), marketingController.getAffiliates);
router.post('/affiliates', authorizeTenantRole(['', 'admin', 'marketing']), marketingController.createAffiliate);

router.get('/abandoned-carts', authorizeTenantRole(['', 'admin', 'marketing']), marketingController.getAbandonedCarts);

router.get('/faqs', authorizeTenantRole(['', 'admin', 'manager', 'marketing', 'support']), marketingController.getFAQs);
router.post('/faqs', authorizeTenantRole(['', 'admin', 'marketing', 'support']), marketingController.createFAQ);

module.exports = router;
