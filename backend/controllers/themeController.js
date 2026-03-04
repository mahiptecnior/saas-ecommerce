const pool = require('../config/db');

// --- Theme CRUD ---
exports.getThemes = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM themes ORDER BY created_at DESC');
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching themes' });
    }
};

exports.createTheme = async (req, res) => {
    const { name, description, preview_url, config_json } = req.body;
    try {
        const [result] = await pool.query(
            'INSERT INTO themes (name, description, preview_url, config_json) VALUES (?, ?, ?, ?)',
            [name, description, preview_url, JSON.stringify(config_json || {})]
        );
        res.status(201).json({ success: true, data: { id: result.insertId, name } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error creating theme' });
    }
};

exports.updateTheme = async (req, res) => {
    const { id } = req.params;
    const { name, description, preview_url, config_json, is_active } = req.body;
    try {
        await pool.query(
            'UPDATE themes SET name = ?, description = ?, preview_url = ?, config_json = ?, is_active = ? WHERE id = ?',
            [name, description, preview_url, JSON.stringify(config_json || {}), is_active, id]
        );
        res.json({ success: true, message: 'Theme updated' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error updating theme' });
    }
};

exports.deleteTheme = async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM themes WHERE id = ?', [id]);
        res.json({ success: true, message: 'Theme deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error deleting theme' });
    }
};

exports.getActiveThemes = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM themes WHERE is_active = true ORDER BY name');
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching active themes' });
    }
};
