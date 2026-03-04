const pool = require('../config/db');

exports.getSettings = async (req, res) => {
    const tenantId = req.tenantId;
    try {
        const [storeSettingsRows] = await pool.query('SELECT * FROM store_settings WHERE tenant_id = ?', [tenantId]);
        const [tenantRows] = await pool.query(
            'SELECT business_name, business_address, business_tax_id, gst_number, bank_details, invoice_template FROM tenants WHERE id = ?',
            [tenantId]
        );

        let settings = { currency: 'USD', store_name: 'My Store' };
        if (storeSettingsRows.length > 0) {
            settings = storeSettingsRows[0];
        }
        if (tenantRows.length > 0) {
            const t = tenantRows[0];
            settings = {
                ...settings,
                business_name: t.business_name,
                business_address: t.business_address,
                business_tax_id: t.business_tax_id,
                gst_number: t.gst_number,
                bank_details: typeof t.bank_details === 'string' ? JSON.parse(t.bank_details) : t.bank_details,
                invoice_template: t.invoice_template
            };
        }
        res.json({ success: true, data: settings });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching settings' });
    }
};

exports.updateSettings = async (req, res) => {
    const tenantId = req.tenantId;
    const {
        store_name, currency, logo_url, seo_title, seo_description, custom_css, builder_layout_json,
        business_name, business_address, business_tax_id, gst_number, bank_details, invoice_template
    } = req.body;

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // Update standard store settings
        await connection.query(
            'INSERT INTO store_settings (tenant_id, store_name, currency, logo_url, seo_title, seo_description, custom_css, builder_layout_json) ' +
            'VALUES (?, ?, ?, ?, ?, ?, ?, ?) ' +
            'ON DUPLICATE KEY UPDATE store_name=?, currency=?, logo_url=?, seo_title=?, seo_description=?, custom_css=?, builder_layout_json=?',
            [tenantId, store_name, currency, logo_url, seo_title, seo_description, custom_css, JSON.stringify(builder_layout_json),
                store_name, currency, logo_url, seo_title, seo_description, custom_css, JSON.stringify(builder_layout_json)]
        );

        // Update tenant business details
        let bankDetailsJson = bank_details ? JSON.stringify(bank_details) : null;
        await connection.query(
            'UPDATE tenants SET business_name=?, business_address=?, business_tax_id=?, gst_number=?, bank_details=?, invoice_template=? WHERE id=?',
            [business_name, business_address, business_tax_id, gst_number, bankDetailsJson, invoice_template || 'standard', tenantId]
        );

        await connection.commit();
        res.json({ success: true, message: 'Settings and Business Profile updated' });
    } catch (error) {
        await connection.rollback();
        console.error("Settings Update Error", error);
        res.status(500).json({ success: false, message: 'Error updating settings' });
    } finally {
        connection.release();
    }
};
