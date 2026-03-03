const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
// const { protect, authorize } = require('../middleware/authMiddleware'); // To be implemented

const adminExtraController = require('../controllers/adminExtraController');

router.get('/tenants', adminController.getTenants);
router.post('/tenants', adminController.createTenant);
router.patch('/tenants/:id/status', adminExtraController.updateTenantStatus);

router.get('/plans', adminController.getPlans);
router.post('/plans', adminController.createPlan);

router.get('/modules', adminExtraController.getModules);
router.get('/tenants/:tenantId/modules', adminExtraController.getTenantModules);
router.post('/tenants/modules', adminExtraController.assignModuleToTenant);
router.post('/tenants/modules/remove', adminExtraController.removeModuleFromTenant);
router.post('/tenants/plan', adminExtraController.assignPlan);
router.get('/analytics', adminController.getAnalytics);

module.exports = router;
