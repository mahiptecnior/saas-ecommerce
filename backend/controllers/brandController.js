const pool = require('../config/db');

exports.getBrands = async (req, res) => {
    const tenantId = req.tenantId;
    try {
        const [rows] = await pool.query('SELECT * FROM brands WHERE tenant_id = ? ORDER BY name ASC', [tenantId]);
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error("Error fetching brands", error);
        res.status(500).json({ success: false, message: 'Error fetching brands' });
    }
};

exports.createBrand = async (req, res) => {
    const tenantId = req.tenantId;
    const { name, logo_url, description, is_active } = req.body;
    try {
        const [result] = await pool.query(
            'INSERT INTO brands (tenant_id, name, logo_url, description, is_active) VALUES (?, ?, ?, ?, ?)',
            [tenantId, name, logo_url || null, description || null, is_active === undefined ? true : is_active]
        );
        res.status(201).json({ success: true, message: 'Brand created', data: { id: result.insertId } });
    } catch (error) {
        console.error("Error creating brand", error);
        res.status(500).json({ success: false, message: 'Error creating brand' });
    }
};

exports.updateBrand = async (req, res) => {
    const tenantId = req.tenantId;
    const { id } = req.params;
    const { name, logo_url, description, is_active } = req.body;
    try {
        await pool.query(
            'UPDATE brands SET name=?, logo_url=?, description=?, is_active=? WHERE id=? AND tenant_id=?',
            [name, logo_url || null, description || null, is_active === undefined ? true : is_active, id, tenantId]
        );
        res.json({ success: true, message: 'Brand updated' });
    } catch (error) {
        console.error("Error updating brand", error);
        res.status(500).json({ success: false, message: 'Error updating brand' });
    }
};

exports.deleteBrand = async (req, res) => {
    const tenantId = req.tenantId;
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM brands WHERE id=? AND tenant_id=?', [id, tenantId]);
        res.json({ success: true, message: 'Brand deleted' });
    } catch (error) {
        console.error("Error deleting brand", error);
        res.status(500).json({ success: false, message: 'Error deleting brand' });
    }
};
