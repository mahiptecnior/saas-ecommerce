const express = require('express');
const router = express.Router();
const billingController = require('../controllers/billingController');

// Create a checkout session
router.post('/create-checkout-session', billingController.createCheckoutSession);

// Stripe webhook (Does NOT require auth, but uses raw body for signature verification)
// Note: Handled differently in server.js due to body-parser requirements
// router.post('/webhook', express.raw({ type: 'application/json' }), billingController.handleWebhook);

module.exports = router;
