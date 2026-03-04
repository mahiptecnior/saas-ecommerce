const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const adminExtraController = require('../controllers/adminExtraController');
const { verifyToken, authorize } = require('../middleware/authMiddleware');

// All admin routes require authentication and super_admin role
router.use(verifyToken, authorize('super_admin'));

// Tenant Management
router.get('/tenants', adminController.getTenants);
router.post('/tenants', adminController.createTenant);
router.put('/tenants/:id', adminController.updateTenant);
router.delete('/tenants/:id', adminController.deleteTenant);
router.patch('/tenants/:id/status', adminExtraController.updateTenantStatus);
router.patch('/tenants/:id/approve', adminExtraController.approveTenant);
router.patch('/tenants/:id/reject', adminExtraController.rejectTenant);
router.get('/tenants/:tenantId/usage', adminExtraController.getTenantUsage);
router.patch('/tenants/:id/domain', adminExtraController.updateCustomDomain);
router.post('/tenants/:tenantId/staff', adminController.createStaffUser);

// Plan Management
router.get('/plans', adminController.getPlans);
router.post('/plans', adminController.createPlan);
router.put('/plans/:id', adminController.updatePlan);
router.delete('/plans/:id', adminController.deletePlan);

// Module Management
router.get('/modules', adminExtraController.getModules);
router.post('/modules', adminExtraController.createModule);
router.put('/modules/:id', adminExtraController.updateModule);
router.delete('/modules/:id', adminExtraController.deleteModule);

// Tenant Module & Plan Assignment
router.get('/tenants/:tenantId/modules', adminExtraController.getTenantModules);
router.post('/tenants/modules', adminExtraController.assignModuleToTenant);
router.post('/tenants/modules/remove', adminExtraController.removeModuleFromTenant);
router.post('/tenants/plan', adminExtraController.assignPlan);

// Add-On Modules
const addonController = require('../controllers/addonController');
router.get('/addons', addonController.getAddons);
router.post('/addons', addonController.createAddon);
router.put('/addons/:id', addonController.updateAddon);
router.delete('/addons/:id', addonController.deleteAddon);

// Invoices & Billing
const invoiceController = require('../controllers/invoiceController');
router.get('/invoices', invoiceController.getInvoices);
router.post('/invoices', invoiceController.generateInvoice);
router.post('/refund', invoiceController.processRefund);

// Tax Settings
router.get('/tax-settings', invoiceController.getTaxSettings);
router.post('/tax-settings', invoiceController.createTaxSetting);
router.put('/tax-settings/:id', invoiceController.updateTaxSetting);
router.delete('/tax-settings/:id', invoiceController.deleteTaxSetting);

// Themes
const themeController = require('../controllers/themeController');
router.get('/themes', themeController.getThemes);
router.post('/themes', themeController.createTheme);
router.put('/themes/:id', themeController.updateTheme);
router.delete('/themes/:id', themeController.deleteTheme);

// Analytics & Audit
router.get('/analytics', adminController.getAnalytics);
router.get('/audit-logs', adminController.getAuditLogs);

// Security & GDPR
const securityController = require('../controllers/securityController');
router.post('/backup', securityController.createBackup);
router.get('/backups', securityController.getBackups);
router.get('/ip-whitelist', securityController.getIpWhitelist);
router.post('/ip-whitelist', securityController.addIp);
router.delete('/ip-whitelist/:id', securityController.removeIp);
router.get('/2fa-status', securityController.get2FAStatus);
router.post('/2fa-toggle', securityController.toggle2FA);
router.get('/tenants/:id/export', securityController.exportTenantData);
router.delete('/tenants/:id/data', securityController.deleteTenantData);

module.exports = router;
