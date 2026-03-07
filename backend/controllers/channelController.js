const pool = require('../config/db');

// --- Channel Management ---
exports.getChannels = async (req, res) => {
    const tenantId = req.tenantId;
    try {
        const [rows] = await pool.query('SELECT * FROM external_channels WHERE tenant_id = ?', [tenantId]);
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching channels' });
    }
};

exports.connectChannel = async (req, res) => {
    const tenantId = req.tenantId;
    const { channel_name, credentials_json } = req.body;
    try {
        await pool.query(
            'INSERT INTO external_channels (tenant_id, channel_name, credentials_json, status) VALUES (?, ?, ?, ?)',
            [tenantId, channel_name, JSON.stringify(credentials_json), 'active']
        );
        res.status(201).json({ success: true, message: 'Channel connected successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error connecting channel' });
    }
};

// --- Sync Stubs ---
exports.getSyncLogs = async (req, res) => {
    const tenantId = req.tenantId;
    try {
        const [rows] = await pool.query(`
            SELECT l.*, c.channel_name 
            FROM channel_sync_logs l
            JOIN external_channels c ON l.channel_id = c.id
            WHERE l.tenant_id = ?
            ORDER BY l.created_at DESC
            LIMIT 50
        `, [tenantId]);
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching sync logs' });
    }
};

exports.triggerSync = async (req, res) => {
    const tenantId = req.tenantId;
    const { channelId } = req.params;
    try {
        // Stub: In a real system, this would call external APIs (Amazon AWS SDK, etc.)
        // We'll just create a log entry to simulate progress.
        await pool.query(
            'INSERT INTO channel_sync_logs (tenant_id, channel_id, event_type, status, details) VALUES (?, ?, ?, ?, ?)',
            [tenantId, channelId, 'inventory_sync', 'success', 'Simulated inventory sync with external channel completed successfully.']
        );
        await pool.query('UPDATE external_channels SET last_sync_at = NOW() WHERE id = ?', [channelId]);

        res.json({ success: true, message: 'Sync triggered successfully (Simulated)' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error triggering sync' });
    }
};
