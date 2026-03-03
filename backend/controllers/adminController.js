const pool = require('../config/db');

exports.getTenants = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM tenants');
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching tenants' });
    }
};

exports.createTenant = async (req, res) => {
    const { name, subdomain } = req.body;
    try {
        const [result] = await pool.query(
            'INSERT INTO tenants (name, subdomain) VALUES (?, ?)',
            [name, subdomain]
        );
        res.status(201).json({ success: true, data: { id: result.insertId, name, subdomain } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error creating tenant' });
    }
};

exports.getPlans = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM plans');
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching plans' });
    }
};

exports.createPlan = async (req, res) => {
    const { name, price_monthly, price_yearly, product_limit, order_limit, staff_limit } = req.body;
    try {
        const [result] = await pool.query(
            'INSERT INTO plans (name, price_monthly, price_yearly, product_limit, order_limit, staff_limit) VALUES (?, ?, ?, ?, ?, ?)',
            [name, price_monthly, price_yearly, product_limit || -1, order_limit || -1, staff_limit || -1]
        );
        res.status(201).json({ success: true, data: { id: result.insertId, name } });
    } catch (error) {
        res.status(501).json({ success: false, message: 'Plan creation logic not fully implemented' });
    }
};

exports.getAnalytics = async (req, res) => {
    try {
        const [tenantsCount] = await pool.query('SELECT COUNT(*) as count FROM tenants');
        const [activeTenantsCount] = await pool.query('SELECT COUNT(*) as count FROM tenants WHERE status = "active"');
        const [revenueRes] = await pool.query('SELECT SUM(total_amount) as total FROM orders WHERE status != "cancelled"');
        const [monthlySalesRes] = await pool.query('SELECT SUM(total_amount) as total FROM orders WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH)');

        const totalRevenue = revenueRes[0].total || 0;
        const commission = totalRevenue * 0.05; // 5% mock commission

        res.json({
            success: true,
            data: {
                totalTenants: tenantsCount[0].count,
                activeTenants: activeTenantsCount[0].count,
                totalRevenue,
                monthlySales: monthlySalesRes[0].total || 0,
                platformCommission: commission,
                subscriptionStatus: 'Healthy'
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching analytics' });
    }
};
