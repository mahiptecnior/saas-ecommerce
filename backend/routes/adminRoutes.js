const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
// const { protect, authorize } = require('../middleware/authMiddleware'); // To be implemented

const adminExtraController = require('../controllers/adminExtraController');

router.get('/tenants', adminController.getTenants);
router.post('/tenants', adminController.createTenant);
router.put('/tenants/:id', adminController.updateTenant);
router.delete('/tenants/:id', adminController.deleteTenant);
router.patch('/tenants/:id/status', adminExtraController.updateTenantStatus);

router.get('/plans', adminController.getPlans);
router.post('/plans', adminController.createPlan);
router.put('/plans/:id', adminController.updatePlan);
router.delete('/plans/:id', adminController.deletePlan);

router.get('/modules', adminExtraController.getModules);
router.post('/modules', adminExtraController.createModule);
router.put('/modules/:id', adminExtraController.updateModule);
router.delete('/modules/:id', adminExtraController.deleteModule);

router.get('/tenants/:tenantId/modules', adminExtraController.getTenantModules);
router.post('/tenants/modules', adminExtraController.assignModuleToTenant);
router.post('/tenants/modules/remove', adminExtraController.removeModuleFromTenant);
router.post('/tenants/plan', adminExtraController.assignPlan);
router.get('/analytics', adminController.getAnalytics);

module.exports = router;
