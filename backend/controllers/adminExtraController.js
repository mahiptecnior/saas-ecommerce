const pool = require('../config/db');
const logger = require('../utils/logger');
const mailService = require('../utils/mailService');

// --- Tenant Operations ---
exports.updateTenantStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // active, suspended, deactivated
    try {
        await pool.query('UPDATE tenants SET status = ? WHERE id = ?', [status, id]);
        await logger.logAction(id, null, 'TENANT_STATUS_UPDATE', { status }, req.ip);
        res.json({ success: true, message: `Tenant status updated to ${status}` });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error updating status' });
    }
};

// --- Module Assignments ---
exports.getModules = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM modules');
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching modules' });
    }
};

exports.createModule = async (req, res) => {
    const { name, description, is_active } = req.body;
    try {
        const [result] = await pool.query(
            'INSERT INTO modules (name, description, is_active) VALUES (?, ?, ?)',
            [name, description, is_active !== undefined ? is_active : 1]
        );
        res.status(201).json({ success: true, data: { id: result.insertId, name, description } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error creating module' });
    }
};

exports.updateModule = async (req, res) => {
    const { id } = req.params;
    const { name, description, is_active } = req.body;
    try {
        await pool.query(
            'UPDATE modules SET name = ?, description = ?, is_active = ? WHERE id = ?',
            [name, description, is_active, id]
        );
        res.json({ success: true, message: 'Module updated successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error updating module' });
    }
};

exports.deleteModule = async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM modules WHERE id = ?', [id]);
        res.json({ success: true, message: 'Module deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error deleting module' });
    }
};

exports.getTenantModules = async (req, res) => {
    const { tenantId } = req.params;
    try {
        const [rows] = await pool.query(
            'SELECT m.* FROM modules m JOIN tenant_modules tm ON m.id = tm.module_id WHERE tm.tenant_id = ?',
            [tenantId]
        );
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching tenant modules' });
    }
};

exports.assignModuleToTenant = async (req, res) => {
    const { tenantId, moduleId } = req.body;
    try {
        await pool.query('INSERT IGNORE INTO tenant_modules (tenant_id, module_id) VALUES (?, ?)', [tenantId, moduleId]);
        res.json({ success: true, message: 'Module assigned to tenant' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error assigning module' });
    }
};

exports.removeModuleFromTenant = async (req, res) => {
    const { tenantId, moduleId } = req.body;
    try {
        await pool.query('DELETE FROM tenant_modules WHERE tenant_id = ? AND module_id = ?', [tenantId, moduleId]);
        res.json({ success: true, message: 'Module removed from tenant' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error removing module' });
    }
};

exports.assignPlan = async (req, res) => {
    const { tenantId, planId } = req.body;
    try {
        // In a real app, this might create a new entry in 'subscriptions' table
        // We'll update the subscription OR just log it for now if we don't have a direct 'plan_id' on tenants table (it's in subscriptions)

        await pool.query(
            'INSERT INTO subscriptions (tenant_id, plan_id, billing_cycle, start_date, end_date) VALUES (?, ?, ?, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 1 MONTH)) ' +
            'ON DUPLICATE KEY UPDATE plan_id = ?, updated_at = CURRENT_TIMESTAMP',
            [tenantId, planId, 'monthly', planId]
        );

        await logger.logAction(tenantId, null, 'PLAN_ASSIGNMENT', { planId }, req.ip);

        // Notify Tenant of Plan Change
        await mailService.sendEmail(
            'tenant@example.com', // Would be owner email
            'Plan Updated',
            `Your subscription plan has been updated to Plan ID: ${planId}.`,
            `<h1>Subscription Updated</h1><p>Your subscription plan has been updated successfully.</p><p>New Plan ID: <strong>${planId}</strong></p>`
        );

        res.json({ success: true, message: 'Plan assigned successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error assigning plan' });
    }
};
