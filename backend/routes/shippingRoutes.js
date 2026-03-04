const express = require('express');
const router = express.Router();
const shippingController = require('../controllers/shippingController');
const authorizeTenantRole = require('../middleware/authorizeTenantRole');
const { verifyToken } = require('../middleware/authMiddleware');

router.use(verifyToken);

router.get('/', authorizeTenantRole('core', 'can_read'), shippingController.getShippingRules);
router.post('/', authorizeTenantRole('core', 'can_write'), shippingController.createShippingRule);
router.put('/:id', authorizeTenantRole('core', 'can_write'), shippingController.updateShippingRule);
router.delete('/:id', authorizeTenantRole('core', 'can_delete'), shippingController.deleteShippingRule);

module.exports = router;
