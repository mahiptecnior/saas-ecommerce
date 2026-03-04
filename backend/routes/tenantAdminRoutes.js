const express = require('express');
const router = express.Router();
const roleController = require('../controllers/roleController');
const staffController = require('../controllers/staffController');
const authorizeTenantRole = require('../middleware/authorizeTenantRole'); // We could use this here if we wanted staff to manage staff, but typically only owners manage staff.

// --- Role Management ---
router.get('/roles', roleController.getRoles);
router.post('/roles', roleController.createRole);
router.put('/roles/:id', roleController.updateRole);
router.delete('/roles/:id', roleController.deleteRole);

// --- Staff Management ---
router.get('/staff', staffController.getStaff);
router.post('/staff', staffController.addStaff);
router.put('/staff/:id', staffController.updateStaff);
router.delete('/staff/:id', staffController.deleteStaff);

module.exports = router;
