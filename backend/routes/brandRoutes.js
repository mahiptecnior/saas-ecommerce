const express = require('express');
const router = express.Router();
const brandController = require('../controllers/brandController');
const authorizeTenantRole = require('../middleware/authorizeTenantRole');
const { verifyToken } = require('../middleware/authMiddleware');

router.use(verifyToken);

router.get('/', authorizeTenantRole('products', 'can_read'), brandController.getBrands);
router.post('/', authorizeTenantRole('products', 'can_write'), brandController.createBrand);
router.put('/:id', authorizeTenantRole('products', 'can_write'), brandController.updateBrand);
router.delete('/:id', authorizeTenantRole('products', 'can_delete'), brandController.deleteBrand);

module.exports = router;
