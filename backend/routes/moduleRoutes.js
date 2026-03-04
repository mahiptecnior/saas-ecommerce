const express = require('express');
const router = express.Router();
const moduleController = require('../controllers/moduleController');
const { verifyToken } = require('../middleware/authMiddleware');

router.use(verifyToken);

// Marketing
router.get('/marketing/coupons', moduleController.getCoupons);
router.post('/marketing/coupons', moduleController.createCoupon);
router.put('/marketing/coupons/:id', moduleController.updateCoupon);
router.delete('/marketing/coupons/:id', moduleController.deleteCoupon);
router.get('/marketing/campaigns', moduleController.getCampaigns);
router.post('/marketing/campaigns', moduleController.launchCampaign);

// Accounts
router.get('/accounts/expenses', moduleController.getExpenses);
router.post('/accounts/expenses', moduleController.addExpense);
router.delete('/accounts/expenses/:id', moduleController.deleteExpense);
router.get('/accounts/summary', moduleController.getFinancialSummary);

// Support (Tenant)
router.get('/support/tickets', moduleController.getTickets);
router.post('/support/tickets', moduleController.createTicket);
router.get('/support/tickets/:id/replies', moduleController.getTicketReplies);
router.post('/support/tickets/:id/replies', moduleController.addTicketReply);
router.patch('/support/tickets/:id/status', moduleController.updateTicketStatus);

module.exports = router;
