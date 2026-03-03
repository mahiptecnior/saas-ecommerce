const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
// const { protect, authorize } = require('../middleware/authMiddleware'); // To be implemented

// For now, these are open but will be protected by Super Admin role check
router.get('/tenants', adminController.getTenants);
router.post('/tenants', adminController.createTenant);
router.get('/plans', adminController.getPlans);
router.post('/plans', adminController.createPlan);

module.exports = router;
