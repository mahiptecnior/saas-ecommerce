const pool = require('../config/db');

exports.getSettings = async (req, res) => {
    const tenantId = req.tenantId;
    try {
        const [rows] = await pool.query('SELECT * FROM store_settings WHERE tenant_id = ?', [tenantId]);
        if (rows.length === 0) {
            // Return defaults if not found
            return res.json({ success: true, data: { currency: 'USD', store_name: 'My Store' } });
        }
        res.json({ success: true, data: rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching settings' });
    }
};

exports.updateSettings = async (req, res) => {
    const tenantId = req.tenantId;
    const { store_name, currency, logo_url, seo_title, seo_description, custom_css, builder_layout_json } = req.body;
    try {
        await pool.query(
            'INSERT INTO store_settings (tenant_id, store_name, currency, logo_url, seo_title, seo_description, custom_css, builder_layout_json) ' +
            'VALUES (?, ?, ?, ?, ?, ?, ?, ?) ' +
            'ON DUPLICATE KEY UPDATE store_name=?, currency=?, logo_url=?, seo_title=?, seo_description=?, custom_css=?, builder_layout_json=?',
            [tenantId, store_name, currency, logo_url, seo_title, seo_description, custom_css, JSON.stringify(builder_layout_json),
                store_name, currency, logo_url, seo_title, seo_description, custom_css, JSON.stringify(builder_layout_json)]
        );
        res.json({ success: true, message: 'Settings updated' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error updating settings' });
    }
};
