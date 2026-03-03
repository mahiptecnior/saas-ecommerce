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

exports.getCampaigns = async (req, res) => {
    const tenantId = req.tenantId;
    try {
        const [rows] = await pool.query('SELECT * FROM campaigns WHERE tenant_id = ?', [tenantId]);
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching campaigns' });
    }
};

// --- Accounts Module ---
exports.getExpenses = async (req, res) => {
    const tenantId = req.tenantId;
    try {
        const [rows] = await pool.query('SELECT * FROM expenses WHERE tenant_id = ?', [tenantId]);
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

// --- Support Module ---
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
            'INSERT INTO tickets (tenant_id, subject, message, priority) VALUES (?, ?, ?, ?)',
            [tenantId, subject, message, priority || 'medium']
        );
        res.status(201).json({ success: true, message: 'Ticket created' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error creating ticket' });
    }
};
