const express = require('express');
const router = express.Router();
const platformSettingsController = require('../controllers/platformSettingsController');

router.get('/', platformSettingsController.getSettings);
router.post('/', platformSettingsController.updateSettings);
router.post('/test', platformSettingsController.testSmtp);

router.post('/logo', platformSettingsController.uploadLogo);

module.exports = router;
