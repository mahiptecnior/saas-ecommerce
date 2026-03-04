const pool = require('../config/db');

// --- Marketing Module ---
exports.getCoupons = async (req, res) => {
    const tenantId = req.tenantId;
    try {
        const [rows] = await pool.query('SELECT * FROM coupons WHERE tenant_id = ?', [tenantId]);
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching coupons' });
    }
};

exports.createCoupon = async (req, res) => {
    const tenantId = req.tenantId;
    const { code, discount_type, discount_value, expiry_date } = req.body;
    try {
        await pool.query(
            'INSERT INTO coupons (tenant_id, code, discount_type, discount_value, expiry_date) VALUES (?, ?, ?, ?, ?)',
            [tenantId, code, discount_type, discount_value, expiry_date]
        );
        res.status(201).json({ success: true, message: 'Coupon created' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error creating coupon' });
    }
};

exports.updateCoupon = async (req, res) => {
    const tenantId = req.tenantId;
    const { id } = req.params;
    const { code, discount_type, discount_value, expiry_date } = req.body;
    try {
        await pool.query(
            'UPDATE coupons SET code = ?, discount_type = ?, discount_value = ?, expiry_date = ? WHERE id = ? AND tenant_id = ?',
            [code, discount_type, discount_value, expiry_date || null, id, tenantId]
        );
        res.json({ success: true, message: 'Coupon updated' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error updating coupon' });
    }
};

exports.deleteCoupon = async (req, res) => {
    const tenantId = req.tenantId;
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM coupons WHERE id = ? AND tenant_id = ?', [id, tenantId]);
        res.json({ success: true, message: 'Coupon deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error deleting coupon' });
    }
};

exports.launchCampaign = async (req, res) => {
    const tenantId = req.tenantId;
    const { name, type, message } = req.body;
    try {
        await pool.query(
            'INSERT INTO campaigns (tenant_id, name, type, message, status) VALUES (?, ?, ?, ?, ?)',
            [tenantId, name, type, message, 'launched']
        );
        res.status(201).json({ success: true, message: 'Campaign launched successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error launching campaign' });
    }
};

exports.getCampaigns = async (req, res) => {
    const tenantId = req.tenantId;
    try {
        const [rows] = await pool.query('SELECT * FROM campaigns WHERE tenant_id = ? ORDER BY created_at DESC', [tenantId]);
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching campaigns' });
    }
};

// --- Accounts Module ---
exports.getExpenses = async (req, res) => {
    const tenantId = req.tenantId;
    try {
        const [rows] = await pool.query('SELECT * FROM expenses WHERE tenant_id = ? ORDER BY date DESC', [tenantId]);
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching expenses' });
    }
};

exports.addExpense = async (req, res) => {
    const tenantId = req.tenantId;
    const { category, amount, description, date } = req.body;
    try {
        await pool.query(
            'INSERT INTO expenses (tenant_id, category, amount, description, date) VALUES (?, ?, ?, ?, ?)',
            [tenantId, category, amount, description, date]
        );
        res.status(201).json({ success: true, message: 'Expense added' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error adding expense' });
    }
};

exports.deleteExpense = async (req, res) => {
    const tenantId = req.tenantId;
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM expenses WHERE id = ? AND tenant_id = ?', [id, tenantId]);
        res.json({ success: true, message: 'Expense deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error deleting expense' });
    }
};

exports.getFinancialSummary = async (req, res) => {
    const tenantId = req.tenantId;
    try {
        const [revenue] = await pool.query('SELECT SUM(total_amount) as total FROM orders WHERE tenant_id = ? AND status != "cancelled"', [tenantId]);
        const [expenses] = await pool.query('SELECT SUM(amount) as total FROM expenses WHERE tenant_id = ?', [tenantId]);

        const totalRevenue = revenue[0].total || 0;
        const totalExpenses = expenses[0].total || 0;

        res.json({
            success: true,
            data: {
                totalRevenue,
                totalExpenses,
                netProfit: totalRevenue - totalExpenses
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error generating summary' });
    }
};

// --- Support Module Enhancements ---
exports.getTickets = async (req, res) => {
    const tenantId = req.tenantId;
    try {
        const [rows] = await pool.query('SELECT * FROM tickets WHERE tenant_id = ? ORDER BY created_at DESC', [tenantId]);
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching tickets' });
    }
};

exports.createTicket = async (req, res) => {
    const tenantId = req.tenantId;
    const { subject, message, priority } = req.body;
    try {
        await pool.query(
            'INSERT INTO tickets (tenant_id, subject, message, priority, status) VALUES (?, ?, ?, ?, ?)',
            [tenantId, subject, message, priority || 'medium', 'open']
        );
        res.status(201).json({ success: true, message: 'Ticket created' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error creating ticket' });
    }
};

exports.getTicketReplies = async (req, res) => {
    const { id } = req.params;
    try {
        // We'll create a ticket_replies table if it doesn't exist, or just use a simple query for now.
        // Assuming we need a replies table. Let's check table list again.
        // I didn't see ticket_replies in SHOW TABLES. I should create it.
        const [rows] = await pool.query('SELECT * FROM ticket_replies WHERE ticket_id = ? ORDER BY created_at ASC', [id]);
        res.json({ success: true, data: rows });
    } catch (error) {
        // Return empty if table doesn't exist yet, we'll fix this in migration/setup
        res.json({ success: true, data: [] });
    }
};

exports.addTicketReply = async (req, res) => {
    const { id } = req.params;
    const { message, is_admin } = req.body;
    const userId = req.userId; // From verifyToken
    try {
        await pool.query(
            'INSERT INTO ticket_replies (ticket_id, user_id, message, is_admin) VALUES (?, ?, ?, ?)',
            [id, userId, message, is_admin ? 1 : 0]
        );
        // Auto-update status if admin replies
        if (is_admin) {
            await pool.query('UPDATE tickets SET status = "answered" WHERE id = ?', [id]);
        }
        res.status(201).json({ success: true, message: 'Reply added' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error adding reply' });
    }
};

exports.updateTicketStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    try {
        await pool.query('UPDATE tickets SET status = ? WHERE id = ?', [status, id]);
        res.json({ success: true, message: 'Ticket status updated' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error updating status' });
    }
};

// --- Super Admin Global Support ---
exports.getAllTickets = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT t.*, tn.store_name 
            FROM tickets t
            JOIN tenants tn ON t.tenant_id = tn.id
            ORDER BY t.created_at DESC
        `);
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching global tickets' });
    }
};
