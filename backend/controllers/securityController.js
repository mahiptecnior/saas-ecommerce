const pool = require('../config/db');
const logger = require('../utils/logger');
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Ensure backup directory
const backupDir = path.join(__dirname, '..', 'backups');
if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

// --- Data Backup ---
exports.createBackup = async (req, res) => {
    try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `backup-${timestamp}.sql`;
        const filepath = path.join(backupDir, filename);

        const dbHost = process.env.DB_HOST || 'localhost';
        const dbUser = process.env.DB_USER || 'root';
        const dbPass = process.env.DB_PASSWORD || '';
        const dbName = process.env.DB_NAME || 'saas_ecom';

        const passFlag = dbPass ? `-p${dbPass}` : '';
        execSync(`mysqldump -h ${dbHost} -u ${dbUser} ${passFlag} ${dbName} > "${filepath}"`, { timeout: 30000 });

        await logger.logAction(null, null, 'DATABASE_BACKUP', { filename }, req.ip);
        res.json({ success: true, data: { filename, created_at: new Date(), size: fs.statSync(filepath).size } });
    } catch (error) {
        console.error('Backup Error:', error.message);
        res.status(500).json({ success: false, message: 'Backup failed: ' + error.message });
    }
};

exports.getBackups = async (req, res) => {
    try {
        const files = fs.readdirSync(backupDir)
            .filter(f => f.endsWith('.sql'))
            .map(f => ({
                filename: f,
                size: fs.statSync(path.join(backupDir, f)).size,
                created_at: fs.statSync(path.join(backupDir, f)).mtime
            }))
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        res.json({ success: true, data: files });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error listing backups' });
    }
};

// --- IP Whitelisting ---
exports.getIpWhitelist = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM ip_whitelist ORDER BY created_at DESC');
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching IP whitelist' });
    }
};

exports.addIp = async (req, res) => {
    const { ip_address, description } = req.body;
    try {
        const [result] = await pool.query('INSERT INTO ip_whitelist (ip_address, description) VALUES (?, ?)', [ip_address, description]);
        res.status(201).json({ success: true, data: { id: result.insertId, ip_address } });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ success: false, message: 'IP already whitelisted' });
        res.status(500).json({ success: false, message: 'Error adding IP' });
    }
};

exports.removeIp = async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM ip_whitelist WHERE id = ?', [id]);
        res.json({ success: true, message: 'IP removed' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error removing IP' });
    }
};

// --- 2FA ---
exports.get2FAStatus = async (req, res) => {
    try {
        const [setting] = await pool.query('SELECT setting_value FROM platform_settings WHERE setting_key = "two_factor_required"');
        const required = setting.length > 0 ? setting[0].setting_value === 'true' : false;
        res.json({ success: true, data: { two_factor_required: required } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching 2FA status' });
    }
};

exports.toggle2FA = async (req, res) => {
    const { enabled } = req.body;
    try {
        await pool.query(
            'UPDATE platform_settings SET setting_value = ? WHERE setting_key = "two_factor_required"',
            [enabled ? 'true' : 'false']
        );
        res.json({ success: true, message: `2FA enforcement ${enabled ? 'enabled' : 'disabled'}` });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error toggling 2FA' });
    }
};

// --- GDPR Data Export ---
exports.exportTenantData = async (req, res) => {
    const { id } = req.params;
    try {
        const [tenant] = await pool.query('SELECT * FROM tenants WHERE id = ?', [id]);
        const [users] = await pool.query('SELECT id, name, email, role, created_at FROM users WHERE tenant_id = ?', [id]);
        const [orders] = await pool.query('SELECT * FROM orders WHERE tenant_id = ?', [id]);
        const [products] = await pool.query('SELECT * FROM products WHERE tenant_id = ?', [id]);
        const [subs] = await pool.query('SELECT * FROM subscriptions WHERE tenant_id = ?', [id]);

        const exportData = {
            exported_at: new Date().toISOString(),
            tenant: tenant[0] || {},
            users,
            orders,
            products,
            subscriptions: subs
        };

        await logger.logAction(id, null, 'GDPR_DATA_EXPORT', {}, req.ip);

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename=tenant-${id}-export.json`);
        res.json(exportData);
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error exporting data' });
    }
};

exports.deleteTenantData = async (req, res) => {
    const { id } = req.params;
    try {
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        await connection.query('DELETE FROM tenant_modules WHERE tenant_id = ?', [id]);
        await connection.query('DELETE FROM tenant_addons WHERE tenant_id = ?', [id]);
        await connection.query('DELETE FROM subscriptions WHERE tenant_id = ?', [id]);
        await connection.query('DELETE FROM orders WHERE tenant_id = ?', [id]);
        await connection.query('DELETE FROM products WHERE tenant_id = ?', [id]);
        await connection.query('DELETE FROM users WHERE tenant_id = ?', [id]);
        await connection.query('DELETE FROM tenants WHERE id = ?', [id]);

        await connection.commit();
        connection.release();

        await logger.logAction(null, null, 'GDPR_DATA_DELETION', { tenant_id: id }, req.ip);

        res.json({ success: true, message: `All data for tenant ${id} has been permanently deleted` });
    } catch (error) {
        console.error('GDPR deletion error:', error);
        res.status(500).json({ success: false, message: 'Error deleting tenant data' });
    }
};
