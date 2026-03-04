const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const authorizeTenantRole = require('../middleware/authorizeTenantRole');

router.get('/', authorizeTenantRole('orders', 'read'), orderController.getOrders);
router.post('/', authorizeTenantRole('orders', 'write'), orderController.createOrder);
router.get('/:id', authorizeTenantRole('orders', 'read'), orderController.getOrder);
router.get('/:id/invoice', authorizeTenantRole('orders', 'read'), orderController.generateOrderInvoice);
router.put('/:id/status', authorizeTenantRole('orders', 'write'), orderController.updateOrderStatus);

module.exports = router;
