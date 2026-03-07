const express = require('express');
const router = express.Router();
const accountingController = require('../controllers/accountingController');
const { authorizeTenantRole } = require('../middleware/authMiddleware');

// Chart of Accounts
router.get('/accounts', authorizeTenantRole(['', 'admin', 'manager', 'accounts']), accountingController.getAccounts);
router.post('/accounts', authorizeTenantRole(['', 'admin', 'accounts']), accountingController.createAccount);

// Journal Entries
router.get('/journals', authorizeTenantRole(['', 'admin', 'accounts']), accountingController.getJournals);
router.post('/journals', authorizeTenantRole(['', 'admin', 'accounts']), accountingController.createJournal);

// Ledger
router.get('/ledger/:accountId', authorizeTenantRole(['', 'admin', 'accounts']), accountingController.getLedger);

// Reports
router.get('/reports/balance-sheet', authorizeTenantRole(['', 'admin', 'accounts']), accountingController.getBalanceSheet);

module.exports = router;
