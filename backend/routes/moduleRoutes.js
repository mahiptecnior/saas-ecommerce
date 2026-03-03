const express = require('express');
const router = express.Router();
const moduleController = require('../controllers/moduleController');

// Marketing
router.get('/marketing/coupons', moduleController.getCoupons);
router.post('/marketing/coupons', moduleController.createCoupon);
router.get('/marketing/campaigns', moduleController.getCampaigns);

// Accounts
router.get('/accounts/expenses', moduleController.getExpenses);
router.post('/accounts/expenses', moduleController.addExpense);
router.get('/accounts/summary', moduleController.getFinancialSummary);

// Support
router.get('/support/tickets', moduleController.getTickets);
router.post('/support/tickets', moduleController.createTicket);

module.exports = router;
