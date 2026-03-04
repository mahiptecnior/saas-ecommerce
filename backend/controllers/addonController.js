const pool = require('../config/db');

// --- Add-On Module CRUD (Admin) ---
exports.getAddons = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT a.*, m.name as module_name FROM addon_modules a 
            JOIN modules m ON a.module_id = m.id ORDER BY a.created_at DESC
        `);
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching addons' });
    }
};

exports.createAddon = async (req, res) => {
    const { module_id, name, price_monthly, price_yearly, description } = req.body;
    try {
        const [result] = await pool.query(
            'INSERT INTO addon_modules (module_id, name, price_monthly, price_yearly, description) VALUES (?, ?, ?, ?, ?)',
            [module_id, name, price_monthly || 0, price_yearly || 0, description]
        );
        res.status(201).json({ success: true, data: { id: result.insertId, name } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error creating addon' });
    }
};

exports.updateAddon = async (req, res) => {
    const { id } = req.params;
    const { name, price_monthly, price_yearly, description, is_active } = req.body;
    try {
        await pool.query(
            'UPDATE addon_modules SET name = ?, price_monthly = ?, price_yearly = ?, description = ?, is_active = ? WHERE id = ?',
            [name, price_monthly, price_yearly, description, is_active, id]
        );
        res.json({ success: true, message: 'Addon updated' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error updating addon' });
    }
};

exports.deleteAddon = async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM tenant_addons WHERE addon_id = ?', [id]);
        await pool.query('DELETE FROM addon_modules WHERE id = ?', [id]);
        res.json({ success: true, message: 'Addon deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error deleting addon' });
    }
};

// --- Tenant Add-On Purchase ---
exports.purchaseAddon = async (req, res) => {
    const tenantId = req.tenantId;
    const { addonId } = req.body;
    try {
        // Get the addon's module_id
        const [addon] = await pool.query('SELECT * FROM addon_modules WHERE id = ? AND is_active = 1', [addonId]);
        if (addon.length === 0) return res.status(404).json({ success: false, message: 'Addon not found' });

        // Add to tenant_addons
        await pool.query('INSERT IGNORE INTO tenant_addons (tenant_id, addon_id) VALUES (?, ?)', [tenantId, addonId]);

        // Also add the module to tenant_modules
        await pool.query('INSERT IGNORE INTO tenant_modules (tenant_id, module_id) VALUES (?, ?)', [tenantId, addon[0].module_id]);

        res.json({ success: true, message: 'Addon purchased and module activated' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error purchasing addon' });
    }
};

exports.getTenantAddons = async (req, res) => {
    const tenantId = req.tenantId || req.params.tenantId;
    try {
        const [rows] = await pool.query(`
            SELECT a.*, ta.purchased_at FROM addon_modules a 
            JOIN tenant_addons ta ON a.id = ta.addon_id 
            WHERE ta.tenant_id = ?
        `, [tenantId]);
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching tenant addons' });
    }
};

// --- Storage Limit Check Utility ---
exports.checkStorageLimit = async (tenantId, fileSizeBytes) => {
    try {
        const [sub] = await pool.query(`
            SELECT p.storage_limit_mb FROM subscriptions s 
            JOIN plans p ON s.plan_id = p.id 
            WHERE s.tenant_id = ? AND s.status = 'active' LIMIT 1
        `, [tenantId]);

        if (sub.length === 0) return { allowed: false, message: 'No active subscription' };

        const limitMb = sub[0].storage_limit_mb;
        if (limitMb === -1) return { allowed: true }; // Unlimited

        // For now, we simply check if the file exceeds remaining. In production, sum all uploads.
        const fileSizeMb = fileSizeBytes / (1024 * 1024);
        if (fileSizeMb > limitMb) {
            return { allowed: false, message: `File exceeds storage limit (${limitMb}MB)` };
        }
        return { allowed: true };
    } catch (error) {
        return { allowed: true }; // Fail open
    }
};
