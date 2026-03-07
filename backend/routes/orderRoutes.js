const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const authorizeTenantRole = require('../middleware/authorizeTenantRole');

router.get('/', authorizeTenantRole('orders', 'read'), orderController.getOrders);
router.post('/', authorizeTenantRole('orders', 'write'), orderController.createOrder);

router.get('/docs', authorizeTenantRole('orders', 'read'), orderController.getBillingDocuments);
router.post('/docs', authorizeTenantRole('orders', 'write'), orderController.createBillingDocument);

router.get('/:id', authorizeTenantRole('orders', 'read'), orderController.getOrder);
router.get('/:id/invoice', authorizeTenantRole('orders', 'read'), orderController.generateOrderInvoice);
router.put('/:id/status', authorizeTenantRole('orders', 'write'), orderController.updateOrderStatus);

// Recurring Invoices
router.get('/recurring', authorizeTenantRole(['', 'admin', 'manager', 'sales']), orderController.getRecurringInvoices);
router.post('/recurring', authorizeTenantRole(['', 'admin', 'manager', 'sales']), orderController.createRecurringInvoice);
router.put('/recurring/:id/status', authorizeTenantRole(['', 'admin', 'manager', 'sales']), orderController.updateRecurringInvoiceStatus);

module.exports = router;
