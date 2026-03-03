const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

// All product routes are tenant-scoped
router.get('/', productController.getProducts);
router.post('/', productController.createProduct);
router.get('/:id', productController.getProduct);
router.put('/:id', productController.updateProduct);
router.delete('/:id', productController.deleteProduct);

module.exports = router;
