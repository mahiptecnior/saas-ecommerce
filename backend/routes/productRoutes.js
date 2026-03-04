const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const authorizeTenantRole = require('../middleware/authorizeTenantRole');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

// All product routes are tenant-scoped AND RBAC protected
router.get('/', authorizeTenantRole('products', 'read'), productController.getProducts);
router.post('/', authorizeTenantRole('products', 'write'), productController.createProduct);
router.post('/bulk-upload', authorizeTenantRole('products', 'write'), upload.single('file'), productController.bulkUpload);
router.get('/:id', authorizeTenantRole('products', 'read'), productController.getProduct);
router.put('/:id', authorizeTenantRole('products', 'write'), productController.updateProduct);
router.delete('/:id', authorizeTenantRole('products', 'delete'), productController.deleteProduct);

module.exports = router;
