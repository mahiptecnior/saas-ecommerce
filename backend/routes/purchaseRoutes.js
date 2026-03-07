const express = require('express');
const router = express.Router();
const purchaseController = require('../controllers/purchaseController');
const { verifyToken } = require('../middleware/authMiddleware');
const tenantContext = require('../middleware/tenantContext');

router.use(verifyToken, tenantContext);

// Vendors
router.get('/vendors', purchaseController.getVendors);
router.post('/vendors', purchaseController.createVendor);
router.put('/vendors/:id', purchaseController.updateVendor);
router.delete('/vendors/:id', purchaseController.deleteVendor);

// Purchase Orders
router.get('/orders', purchaseController.getPurchaseOrders);
router.get('/orders/:id', purchaseController.getPurchaseOrderDetails);
router.post('/orders', purchaseController.createPurchaseOrder);
router.post('/orders/:id/receive', purchaseController.receivePurchaseOrder);

// Invoices & Ledger
router.get('/invoices', purchaseController.getPurchaseInvoices);
router.post('/invoices', purchaseController.createPurchaseInvoice);

router.get('/vendors/:vendor_id/ledger', purchaseController.getVendorLedger);
router.post('/vendors/payment', purchaseController.recordVendorPayment);

module.exports = router;
