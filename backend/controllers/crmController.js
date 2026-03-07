const pool = require('../config/db');

// --- CRM Leads (Kanban) ---
exports.getLeads = async (req, res) => {
    const tenantId = req.tenantId;
    try {
        const [rows] = await pool.query('SELECT * FROM crm_leads WHERE tenant_id = ? ORDER BY created_at DESC', [tenantId]);
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching leads' });
    }
};

exports.createLead = async (req, res) => {
    const tenantId = req.tenantId;
    const { name, email, phone, stage, value, source, notes } = req.body;
    try {
        const [result] = await pool.query(
            'INSERT INTO crm_leads (tenant_id, name, email, phone, stage, value, source, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [tenantId, name, email, phone, stage || 'new', value || 0, source, notes]
        );
        res.status(201).json({ success: true, data: { id: result.insertId, name } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error creating lead' });
    }
};

exports.updateLeadStage = async (req, res) => {
    const tenantId = req.tenantId;
    const { id } = req.params;
    const { stage } = req.body;
    try {
        await pool.query('UPDATE crm_leads SET stage = ? WHERE id = ? AND tenant_id = ?', [stage, id, tenantId]);
        res.json({ success: true, message: 'Lead stage updated' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error updating lead' });
    }
};

// --- Loyalty Points ---
exports.getCustomerLoyalty = async (req, res) => {
    const tenantId = req.tenantId;
    const { customerId } = req.params;
    try {
        const [rows] = await pool.query('SELECT SUM(points) as total_points FROM loyalty_points WHERE tenant_id = ? AND customer_id = ?', [tenantId, customerId]);
        const [history] = await pool.query('SELECT * FROM loyalty_points WHERE tenant_id = ? AND customer_id = ? ORDER BY created_at DESC', [tenantId, customerId]);
        res.json({ success: true, data: { total: rows[0].total_points || 0, history } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching loyalty data' });
    }
};

exports.adjustLoyaltyPoints = async (req, res) => {
    const tenantId = req.tenantId;
    const { customer_id, points, transaction_type, description } = req.body;
    try {
        await pool.query(
            'INSERT INTO loyalty_points (tenant_id, customer_id, points, transaction_type, description) VALUES (?, ?, ?, ?, ?)',
            [tenantId, customer_id, points, transaction_type, description]
        );
        res.json({ success: true, message: 'Loyalty points adjusted' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error adjusting points' });
    }
};
