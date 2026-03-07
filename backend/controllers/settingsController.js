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
        business_name, business_address, business_tax_id, gst_number, bank_details, invoice_template,
        smtp_host, smtp_port, smtp_user, smtp_pass, smtp_from
    } = req.body;

    try {
        // 1. Update store_settings
        const layoutJson = JSON.stringify(builder_layout_json || {});
        const parsedSmtpPort = (smtp_port && !isNaN(smtp_port)) ? parseInt(smtp_port) : null;

        const storeParams = [
            tenantId, store_name || '', currency || 'USD', logo_url || '', seo_title || '', seo_description || '', custom_css || '', layoutJson, smtp_host || null, parsedSmtpPort, smtp_user || null, smtp_pass || null, smtp_from || null, // INSERT
            store_name || '', currency || 'USD', logo_url || '', seo_title || '', seo_description || '', custom_css || '', layoutJson, smtp_host || null, parsedSmtpPort, smtp_user || null, smtp_pass || null, smtp_from || null // UPDATE
        ];

        await pool.query(
            `INSERT INTO store_settings (tenant_id, store_name, currency, logo_url, seo_title, seo_description, custom_css, builder_layout_json, smtp_host, smtp_port, smtp_user, smtp_pass, smtp_from) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) 
             ON DUPLICATE KEY UPDATE 
                store_name=?, currency=?, logo_url=?, seo_title=?, seo_description=?, custom_css=?, builder_layout_json=?, smtp_host=?, smtp_port=?, smtp_user=?, smtp_pass=?, smtp_from=?`,
            storeParams
        );

        // 2. Update tenants table for business details
        let bankDetailsJson = bank_details ? JSON.stringify(bank_details) : null;
        await pool.query(
            'UPDATE tenants SET business_name=?, business_address=?, business_tax_id=?, gst_number=?, bank_details=?, invoice_template=? WHERE id=?',
            [business_name || '', business_address || '', business_tax_id || '', gst_number || '', bankDetailsJson, invoice_template || 'standard', tenantId]
        );

        res.json({ success: true, message: 'Settings and Business Profile updated' });
    } catch (error) {
        console.error("Settings Update Error:", error);
        res.status(500).json({ success: false, message: 'Error updating settings: ' + error.message });
    }
};

const mailService = require('../utils/mailService');

exports.testSMTP = async (req, res) => {
    try {
        const config = req.body;
        const result = await mailService.testSMTP(config);
        res.json({ success: true, message: 'SMTP connection verified and test email sent!', data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: 'SMTP Test Failed: ' + error.message });
    }
};
