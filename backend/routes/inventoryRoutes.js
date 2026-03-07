const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const { verifyToken } = require('../middleware/authMiddleware');
const tenantContext = require('../middleware/tenantContext');

router.use(verifyToken, tenantContext);

// Warehouses
router.get('/warehouses', inventoryController.getWarehouses);
router.post('/warehouses', inventoryController.createWarehouse);

// Inventory Levels & Adjustments
router.get('/', inventoryController.getInventory);
router.post('/adjust', inventoryController.adjustInventory);

// Batches
router.get('/batches', inventoryController.getBatches);
router.post('/batches', inventoryController.createBatch);

module.exports = router;
