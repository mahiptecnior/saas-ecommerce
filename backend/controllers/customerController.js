const pool = require('../config/db');

exports.getCustomers = async (req, res) => {
    const tenantId = req.tenantId;
    try {
        const [rows] = await pool.query('SELECT * FROM customers WHERE tenant_id = ? ORDER BY created_at DESC', [tenantId]);
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching customers' });
    }
};

exports.createCustomer = async (req, res) => {
    const tenantId = req.tenantId;
    const { name, email, phone, address } = req.body;
    if (!name || !email) return res.status(400).json({ success: false, message: 'Name and email required' });
    try {
        const [result] = await pool.query(
            'INSERT INTO customers (tenant_id, name, email, phone, address) VALUES (?, ?, ?, ?, ?)',
            [tenantId, name, email, phone || null, address || null]
        );
        res.status(201).json({ success: true, data: { id: result.insertId, name, email } });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ success: false, message: 'Email already exists for this store' });
        }
        res.status(500).json({ success: false, message: 'Error creating customer' });
    }
};

exports.updateCustomer = async (req, res) => {
    const tenantId = req.tenantId;
    const { id } = req.params;
    const { name, email, phone, address } = req.body;
    try {
        await pool.query(
            'UPDATE customers SET name = ?, email = ?, phone = ?, address = ? WHERE id = ? AND tenant_id = ?',
            [name, email, phone || null, address || null, id, tenantId]
        );
        res.json({ success: true, message: 'Customer updated' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error updating customer' });
    }
};

exports.deleteCustomer = async (req, res) => {
    const tenantId = req.tenantId;
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM customers WHERE id = ? AND tenant_id = ?', [id, tenantId]);
        res.json({ success: true, message: 'Customer deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error deleting customer' });
    }
};

exports.getCustomerOrders = async (req, res) => {
    const tenantId = req.tenantId;
    const { id } = req.params;
    try {
        const [rows] = await pool.query('SELECT * FROM orders WHERE tenant_id = ? AND customer_id = ? ORDER BY created_at DESC', [tenantId, id]);
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching customer orders' });
    }
};
