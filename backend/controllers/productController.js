const pool = require('../config/db');

exports.getProducts = async (req, res) => {
    const tenantId = req.tenantId;
    if (!tenantId) {
        return res.status(400).json({ success: false, message: 'Tenant context missing' });
    }

    try {
        const [rows] = await pool.query('SELECT * FROM products WHERE tenant_id = ?', [tenantId]);
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching products' });
    }
};

exports.createProduct = async (req, res) => {
    const tenantId = req.tenantId;
    const { name, description, price, sku } = req.body;

    if (!tenantId) {
        return res.status(400).json({ success: false, message: 'Tenant context missing' });
    }

    try {
        const [result] = await pool.query(
            'INSERT INTO products (tenant_id, name, description, price, sku) VALUES (?, ?, ?, ?, ?)',
            [tenantId, name, description, price, sku]
        );
        res.status(201).json({ success: true, data: { id: result.insertId, name } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error creating product' });
    }
};

exports.getProduct = async (req, res) => {
    const tenantId = req.tenantId;
    const { id } = req.params;

    try {
        const [rows] = await pool.query('SELECT * FROM products WHERE id = ? AND tenant_id = ?', [id, tenantId]);
        if (rows.length === 0) return res.status(404).json({ success: false, message: 'Product not found' });
        res.json({ success: true, data: rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching product' });
    }
};

exports.updateProduct = async (req, res) => {
    const tenantId = req.tenantId;
    const { id } = req.params;
    const { name, description, price, sku } = req.body;

    try {
        await pool.query(
            'UPDATE products SET name = ?, description = ?, price = ?, sku = ? WHERE id = ? AND tenant_id = ?',
            [name, description, price, sku, id, tenantId]
        );
        res.json({ success: true, message: 'Product updated' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error updating product' });
    }
};

exports.deleteProduct = async (req, res) => {
    const tenantId = req.tenantId;
    const { id } = req.params;

    try {
        await pool.query('DELETE FROM products WHERE id = ? AND tenant_id = ?', [id, tenantId]);
        res.json({ success: true, message: 'Product deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error deleting product' });
    }
};
