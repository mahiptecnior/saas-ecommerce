const pool = require('../config/db');

// --- Affiliate Program ---
exports.getAffiliates = async (req, res) => {
    const tenantId = req.tenantId;
    try {
        const [rows] = await pool.query(`
            SELECT a.*, c.name as customer_name, c.email as customer_email
            FROM affiliate_profiles a
            JOIN customers c ON a.customer_id = c.id
            WHERE a.tenant_id = ?
        `, [tenantId]);
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching affiliates' });
    }
};

exports.createAffiliate = async (req, res) => {
    const tenantId = req.tenantId;
    const { customer_id, referral_code, commission_rate } = req.body;
    try {
        await pool.query(
            'INSERT INTO affiliate_profiles (tenant_id, customer_id, referral_code, commission_rate) VALUES (?, ?, ?, ?)',
            [tenantId, customer_id, referral_code, commission_rate || 0]
        );
        res.status(201).json({ success: true, message: 'Affiliate profile created' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error creating affiliate' });
    }
};

// --- Abandoned Carts (Stub/Logic) ---
exports.getAbandonedCarts = async (req, res) => {
    const tenantId = req.tenantId;
    try {
        // Abandoned carts are basically orders with status 'pending' older than 24 hours
        const [rows] = await pool.query(`
            SELECT o.*, c.name as customer_name, c.email as customer_email
            FROM orders o
            JOIN customers c ON o.customer_id = c.id
            WHERE o.tenant_id = ? AND o.status = 'pending' 
            AND o.created_at < NOW() - INTERVAL 1 DAY
            ORDER BY o.created_at DESC
        `, [tenantId]);
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching abandoned carts' });
    }
};

// --- FAQ Management ---
exports.getFAQs = async (req, res) => {
    const tenantId = req.tenantId;
    try {
        const [rows] = await pool.query('SELECT * FROM faqs WHERE tenant_id = ? ORDER BY display_order ASC', [tenantId]);
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching FAQs' });
    }
};

exports.createFAQ = async (req, res) => {
    const tenantId = req.tenantId;
    const { question, answer, category, display_order } = req.body;
    try {
        await pool.query(
            'INSERT INTO faqs (tenant_id, question, answer, category, display_order) VALUES (?, ?, ?, ?, ?)',
            [tenantId, question, answer, category, display_order || 0]
        );
        res.status(201).json({ success: true, message: 'FAQ created' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error creating FAQ' });
    }
};
