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
    const { name, price_monthly, price_yearly } = req.body;
    try {
        const [result] = await pool.query(
            'INSERT INTO plans (name, price_monthly, price_yearly) VALUES (?, ?, ?)',
            [name, price_monthly, price_yearly]
        );
        res.status(201).json({ success: true, data: { id: result.insertId, name } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error creating plan' });
    }
};
