const express = require('express');
const router = express.Router();
const channelController = require('../controllers/channelController');
const { authorizeTenantRole } = require('../middleware/authMiddleware');

router.get('/', authorizeTenantRole(['', 'admin', 'manager', 'sales']), channelController.getChannels);
router.post('/connect', authorizeTenantRole(['', 'admin', 'manager']), channelController.connectChannel);
router.get('/logs', authorizeTenantRole(['', 'admin', 'manager', 'sales']), channelController.getSyncLogs);
router.post('/:channelId/sync', authorizeTenantRole(['', 'admin', 'manager']), channelController.triggerSync);

module.exports = router;
