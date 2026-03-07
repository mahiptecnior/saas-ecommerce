const pool = require('../config/db');

// --- BI Analytics ---
exports.getBusinessHealth = async (req, res) => {
    const tenantId = req.tenantId;
    try {
        // 1. Net Profit/Loss (Simple calc: Revenue - COGS - Expenses)
        // Note: COGS logic depends on product variant unit costs
        const [revenue] = await pool.query('SELECT SUM(total_amount) as total FROM orders WHERE tenant_id = ? AND status != "cancelled"', [tenantId]);
        const [expenses] = await pool.query('SELECT SUM(amount) as total FROM expenses WHERE tenant_id = ?', [tenantId]);

        // 2. Customer LTV (Lifetime Value)
        const [ltv] = await pool.query(`
            SELECT AVG(total_spend) as avg_ltv FROM (
                SELECT customer_id, SUM(total_amount) as total_spend 
                FROM orders 
                WHERE tenant_id = ? AND status = 'delivered'
                GROUP BY customer_id
            ) as customer_spend
        `, [tenantId]);

        // 3. Churn Rate (Customers who haven't ordered in 60 days vs total active)
        const [activeCount] = await pool.query('SELECT COUNT(DISTINCT customer_id) as total FROM orders WHERE tenant_id = ?', [tenantId]);
        const [churnedCount] = await pool.query(`
            SELECT COUNT(DISTINCT customer_id) as total FROM orders 
            WHERE tenant_id = ? 
            AND customer_id NOT IN (
                SELECT DISTINCT customer_id FROM orders 
                WHERE tenant_id = ? AND created_at > NOW() - INTERVAL 60 DAY
            )
        `, [tenantId, tenantId]);

        const totalRevenue = revenue[0].total || 0;
        const totalExpenses = expenses[0].total || 0;
        const avgLTV = ltv[0].avg_ltv || 0;
        const churnRate = activeCount[0].total > 0 ? (churnedCount[0].total / activeCount[0].total) * 100 : 0;

        res.json({
            success: true,
            data: {
                totalRevenue,
                totalExpenses,
                netProfit: totalRevenue - totalExpenses,
                avgLTV,
                churnRate: churnRate.toFixed(2) + '%'
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching BI data' });
    }
};

// --- Scheduled Reports ---
exports.getScheduledReports = async (req, res) => {
    const tenantId = req.tenantId;
    try {
        const [rows] = await pool.query('SELECT * FROM scheduled_reports WHERE tenant_id = ?', [tenantId]);
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching reports' });
    }
};

exports.createScheduledReport = async (req, res) => {
    const tenantId = req.tenantId;
    const { report_type, frequency, recipient_emails } = req.body;
    try {
        await pool.query(
            'INSERT INTO scheduled_reports (tenant_id, report_type, frequency, recipient_emails) VALUES (?, ?, ?, ?)',
            [tenantId, report_type, frequency, recipient_emails]
        );
        res.status(201).json({ success: true, message: 'Scheduled report created' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error scheduling report' });
    }
};
