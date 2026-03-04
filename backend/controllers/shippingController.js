const pool = require('../config/db');

exports.getShippingRules = async (req, res) => {
    const tenantId = req.tenantId;
    try {
        const [rows] = await pool.query('SELECT * FROM shipping_rules WHERE tenant_id = ?', [tenantId]);
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error("Error fetching shipping rules", error);
        res.status(500).json({ success: false, message: 'Error fetching shipping rules' });
    }
};

exports.createShippingRule = async (req, res) => {
    const tenantId = req.tenantId;
    const { name, regions, rate, condition_type, condition_value, is_active } = req.body;
    try {
        const [result] = await pool.query(
            'INSERT INTO shipping_rules (tenant_id, name, regions, rate, condition_type, condition_value, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [tenantId, name, JSON.stringify(regions || []), rate || 0, condition_type || 'flat', condition_value || null, is_active === undefined ? true : is_active]
        );
        res.status(201).json({ success: true, message: 'Shipping rule created', data: { id: result.insertId } });
    } catch (error) {
        console.error("Error creating shipping rule", error);
        res.status(500).json({ success: false, message: 'Error creating shipping rule' });
    }
};

exports.updateShippingRule = async (req, res) => {
    const tenantId = req.tenantId;
    const { id } = req.params;
    const { name, regions, rate, condition_type, condition_value, is_active } = req.body;
    try {
        await pool.query(
            'UPDATE shipping_rules SET name=?, regions=?, rate=?, condition_type=?, condition_value=?, is_active=? WHERE id=? AND tenant_id=?',
            [name, JSON.stringify(regions || []), rate || 0, condition_type || 'flat', condition_value || null, is_active === undefined ? true : is_active, id, tenantId]
        );
        res.json({ success: true, message: 'Shipping rule updated' });
    } catch (error) {
        console.error("Error updating shipping rule", error);
        res.status(500).json({ success: false, message: 'Error updating shipping rule' });
    }
};

exports.deleteShippingRule = async (req, res) => {
    const tenantId = req.tenantId;
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM shipping_rules WHERE id=? AND tenant_id=?', [id, tenantId]);
        res.json({ success: true, message: 'Shipping rule deleted' });
    } catch (error) {
        console.error("Error deleting shipping rule", error);
        res.status(500).json({ success: false, message: 'Error deleting shipping rule' });
    }
};
