const pool = require('../config/db');
const bcrypt = require('bcryptjs');


exports.getTenants = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM tenants');
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching tenants' });
    }
};

exports.createTenant = async (req, res) => {
    const { name, subdomain, business_name, business_address, business_tax_id, owner_name, owner_email, owner_phone, password } = req.body;
    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const [tenantResult] = await connection.query(
            `INSERT INTO tenants 
             (name, subdomain, business_name, business_address, business_tax_id, owner_name, owner_email, owner_phone) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [name, subdomain, business_name, business_address, business_tax_id, owner_name, owner_email, owner_phone]
        );
        const tenantId = tenantResult.insertId;

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        await connection.query(
            'INSERT INTO users (tenant_id, name, email, password, role) VALUES (?, ?, ?, ?, ?)',
            [tenantId, owner_name || name, owner_email, hashedPassword, 'tenant_owner']
        );

        await connection.commit();
        res.status(201).json({ success: true, data: { id: tenantId, name, subdomain } });
    } catch (error) {
        if (connection) await connection.rollback();
        console.error("Create Tenant Error:", error);
        res.status(500).json({ success: false, message: 'Error creating tenant' });
    } finally {
        if (connection) connection.release();
    }
};

exports.getPlans = async (req, res) => {
    try {
        const [plans] = await pool.query('SELECT * FROM plans');
        const [planModules] = await pool.query('SELECT * FROM plan_modules');

        const plansWithModules = plans.map(plan => {
            return {
                ...plan,
                modules: planModules.filter(pm => pm.plan_id === plan.id).map(pm => pm.module_id)
            };
        });

        res.json({ success: true, data: plansWithModules });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching plans' });
    }
};

exports.createPlan = async (req, res) => {
    const { name, price_monthly, price_yearly, product_limit, order_limit, staff_limit, moduleIds } = req.body;
    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const [result] = await connection.query(
            'INSERT INTO plans (name, price_monthly, price_yearly, product_limit, order_limit, staff_limit) VALUES (?, ?, ?, ?, ?, ?)',
            [name, price_monthly, price_yearly, product_limit || -1, order_limit || -1, staff_limit || -1]
        );
        const planId = result.insertId;

        if (moduleIds && Array.isArray(moduleIds) && moduleIds.length > 0) {
            const values = moduleIds.map(mid => [planId, mid]);
            await connection.query('INSERT INTO plan_modules (plan_id, module_id) VALUES ?', [values]);
        }

        await connection.commit();
        res.status(201).json({ success: true, data: { id: planId, name } });
    } catch (error) {
        if (connection) await connection.rollback();
        console.error(error);
        res.status(500).json({ success: false, message: 'Error creating plan' });
    } finally {
        if (connection) connection.release();
    }
};

exports.updatePlan = async (req, res) => {
    const { id } = req.params;
    const { name, price_monthly, price_yearly, product_limit, order_limit, staff_limit, description, moduleIds } = req.body;
    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        await connection.query(
            'UPDATE plans SET name = ?, price_monthly = ?, price_yearly = ?, product_limit = ?, order_limit = ?, staff_limit = ?, description = ? WHERE id = ?',
            [name, price_monthly, price_yearly, product_limit, order_limit, staff_limit, description, id]
        );

        if (moduleIds && Array.isArray(moduleIds)) {
            await connection.query('DELETE FROM plan_modules WHERE plan_id = ?', [id]);
            if (moduleIds.length > 0) {
                const values = moduleIds.map(mid => [id, mid]);
                await connection.query('INSERT INTO plan_modules (plan_id, module_id) VALUES ?', [values]);
            }
        }

        await connection.commit();
        res.json({ success: true, message: 'Plan updated successfully' });
    } catch (error) {
        if (connection) await connection.rollback();
        console.error(error);
        res.status(500).json({ success: false, message: 'Error updating plan' });
    } finally {
        if (connection) connection.release();
    }
};

exports.deletePlan = async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM plans WHERE id = ?', [id]);
        res.json({ success: true, message: 'Plan deleted successfully' });
    } catch (error) {
        console.error("Delete Plan Error:", error);
        res.status(500).json({ success: false, message: 'Error deleting plan' });
    }
};

exports.updateTenant = async (req, res) => {
    const { id } = req.params;
    const { name, subdomain, status, business_name, business_address, business_tax_id, owner_name, owner_email, owner_phone } = req.body;
    try {
        await pool.query(
            'UPDATE tenants SET name = ?, subdomain = ?, status = ?, business_name = ?, business_address = ?, business_tax_id = ?, owner_name = ?, owner_email = ?, owner_phone = ? WHERE id = ?',
            [name, subdomain, status, business_name, business_address, business_tax_id, owner_name, owner_email, owner_phone, id]
        );
        res.json({ success: true, message: 'Tenant updated successfully' });
    } catch (error) {
        console.error("Update Tenant Error:", error);
        res.status(500).json({ success: false, message: 'Error updating tenant' });
    }
};

exports.deleteTenant = async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM tenants WHERE id = ?', [id]);
        res.json({ success: true, message: 'Tenant deleted successfully' });
    } catch (error) {
        console.error("Delete Tenant Error:", error);
        res.status(500).json({ success: false, message: 'Error deleting tenant' });
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
