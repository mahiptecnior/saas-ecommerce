const pool = require('../config/db');

exports.getCategories = async (req, res) => {
    const tenantId = req.tenantId;
    try {
        const [rows] = await pool.query('SELECT * FROM categories WHERE tenant_id = ?', [tenantId]);
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching categories' });
    }
};

exports.createCategory = async (req, res) => {
    const tenantId = req.tenantId;
    const { name, slug, parent_id } = req.body;
    try {
        const [result] = await pool.query(
            'INSERT INTO categories (tenant_id, name, slug, parent_id) VALUES (?, ?, ?, ?)',
            [tenantId, name, slug, parent_id || null]
        );
        res.status(201).json({ success: true, data: { id: result.insertId, name } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error creating category' });
    }
};

exports.deleteCategory = async (req, res) => {
    const tenantId = req.tenantId;
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM categories WHERE id = ? AND tenant_id = ?', [id, tenantId]);
        res.json({ success: true, message: 'Category deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error deleting category' });
    }
};
