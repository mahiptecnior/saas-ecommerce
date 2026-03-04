const pool = require('../config/db');
const bcrypt = require('bcryptjs');


exports.getTenants = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT t.*, 
                   s.plan_id, s.billing_cycle, s.start_date, s.end_date, s.status as subscription_status,
                   p.name as current_plan_name, p.price_monthly as plan_price
            FROM tenants t
            LEFT JOIN subscriptions s ON t.id = s.tenant_id AND s.status = 'active'
            LEFT JOIN plans p ON s.plan_id = p.id
            ORDER BY t.created_at DESC
        `);
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
    const { name, price_monthly, price_yearly, product_limit, order_limit, staff_limit, trial_days, moduleIds } = req.body;
    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const [result] = await connection.query(
            'INSERT INTO plans (name, price_monthly, price_yearly, product_limit, order_limit, staff_limit, trial_days) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [name, price_monthly, price_yearly, product_limit || -1, order_limit || -1, staff_limit || -1, trial_days || 0]
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
    const { name, price_monthly, price_yearly, product_limit, order_limit, staff_limit, description, trial_days, moduleIds } = req.body;
    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        await connection.query(
            'UPDATE plans SET name = ?, price_monthly = ?, price_yearly = ?, product_limit = ?, order_limit = ?, staff_limit = ?, description = ?, trial_days = ? WHERE id = ?',
            [name, price_monthly, price_yearly, product_limit, order_limit, staff_limit, description, trial_days || 0, id]
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

        // MRR from active subscriptions
        const [mrrRes] = await pool.query(`
            SELECT SUM(p.price_monthly) as mrr 
            FROM subscriptions s 
            JOIN plans p ON s.plan_id = p.id 
            WHERE s.status = 'active'
        `);
        const mrr = mrrRes[0].mrr || 0;

        // Revenue per plan breakdown
        const [planRevenue] = await pool.query(`
            SELECT p.name as plan_name, COUNT(s.id) as subscriber_count, 
                   SUM(p.price_monthly) as monthly_revenue
            FROM subscriptions s 
            JOIN plans p ON s.plan_id = p.id 
            WHERE s.status = 'active'
            GROUP BY p.id, p.name
            ORDER BY monthly_revenue DESC
        `);

        // Monthly revenue trend (last 6 months)
        const [monthlyTrend] = await pool.query(`
            SELECT DATE_FORMAT(created_at, '%Y-%m') as month, 
                   SUM(total_amount) as revenue,
                   COUNT(*) as order_count
            FROM orders 
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH) 
              AND status != 'cancelled'
            GROUP BY DATE_FORMAT(created_at, '%Y-%m')
            ORDER BY month ASC
        `);

        // Tenant growth trend (last 6 months)
        const [tenantTrend] = await pool.query(`
            SELECT DATE_FORMAT(created_at, '%Y-%m') as month, 
                   COUNT(*) as new_tenants
            FROM tenants 
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
            GROUP BY DATE_FORMAT(created_at, '%Y-%m')
            ORDER BY month ASC
        `);

        // Churn rate: expired subs this month / total active at start of month
        const [churnExpired] = await pool.query(
            `SELECT COUNT(*) as count FROM subscriptions WHERE status = 'expired' AND updated_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01')`
        );
        const [totalSubsStart] = await pool.query(
            `SELECT COUNT(*) as count FROM subscriptions WHERE created_at < DATE_FORMAT(CURDATE(), '%Y-%m-01')`
        );
        const churnRate = totalSubsStart[0].count > 0
            ? ((churnExpired[0].count / totalSubsStart[0].count) * 100).toFixed(1)
            : 0;

        // Configurable commission from platform_settings
        const [commSetting] = await pool.query(
            `SELECT setting_value FROM platform_settings WHERE setting_key = 'commission_rate' LIMIT 1`
        );
        const commissionRate = commSetting.length > 0 ? parseFloat(commSetting[0].setting_value) : 5;
        const commission = totalRevenue * (commissionRate / 100);

        res.json({
            success: true,
            data: {
                totalTenants: tenantsCount[0].count,
                activeTenants: activeTenantsCount[0].count,
                totalRevenue,
                monthlySales: monthlySalesRes[0].total || 0,
                platformCommission: commission,
                commissionRate,
                subscriptionStatus: 'Healthy',
                mrr,
                arr: mrr * 12,
                planRevenue,
                monthlyTrend,
                tenantTrend,
                churnRate: parseFloat(churnRate)
            }
        });
    } catch (error) {
        console.error('Analytics Error:', error);
        res.status(500).json({ success: false, message: 'Error fetching analytics' });
    }
};

// --- Staff User Creation with Limit Enforcement ---
exports.createStaffUser = async (req, res) => {
    const { tenantId } = req.params;
    const { name, email, password } = req.body;

    try {
        // 1. Check staff limit from tenant's active subscription plan
        const [subs] = await pool.query(`
            SELECT p.staff_limit
            FROM subscriptions s
            JOIN plans p ON s.plan_id = p.id
            WHERE s.tenant_id = ? AND s.status = 'active'
            ORDER BY s.updated_at DESC LIMIT 1
        `, [tenantId]);

        if (subs.length > 0) {
            const staffLimit = subs[0].staff_limit;
            if (staffLimit !== -1) {
                const [staffCount] = await pool.query(
                    'SELECT COUNT(*) as count FROM users WHERE tenant_id = ? AND role = "staff"',
                    [tenantId]
                );
                if (staffCount[0].count >= staffLimit) {
                    return res.status(403).json({
                        success: false,
                        code: 'LIMIT_REACHED',
                        message: `Staff limit reached (${staffLimit}). Upgrade the tenant's plan to add more staff.`
                    });
                }
            }
        }

        // 2. Create the staff user
        const hashedPassword = await bcrypt.hash(password, 10);
        const [result] = await pool.query(
            'INSERT INTO users (tenant_id, name, email, password, role) VALUES (?, ?, ?, ?, ?)',
            [tenantId, name, email, hashedPassword, 'staff']
        );

        res.status(201).json({ success: true, data: { id: result.insertId, name, email, role: 'staff' } });
    } catch (error) {
        console.error('Create Staff Error:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ success: false, message: 'Email already exists.' });
        }
        res.status(500).json({ success: false, message: 'Error creating staff user' });
    }
};

// --- Audit Logs with Pagination & Filters ---
exports.getAuditLogs = async (req, res) => {
    const { page = 1, limit = 25, tenant_id, action, start_date, end_date } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = '1=1';
    const params = [];

    if (tenant_id) {
        whereClause += ' AND al.tenant_id = ?';
        params.push(tenant_id);
    }
    if (action) {
        whereClause += ' AND al.action LIKE ?';
        params.push(`%${action}%`);
    }
    if (start_date) {
        whereClause += ' AND al.created_at >= ?';
        params.push(start_date);
    }
    if (end_date) {
        whereClause += ' AND al.created_at <= ?';
        params.push(end_date + ' 23:59:59');
    }

    try {
        const [countRes] = await pool.query(
            `SELECT COUNT(*) as total FROM audit_logs al WHERE ${whereClause}`, params
        );

        const [logs] = await pool.query(
            `SELECT al.*, t.name as tenant_name 
             FROM audit_logs al 
             LEFT JOIN tenants t ON al.tenant_id = t.id 
             WHERE ${whereClause} 
             ORDER BY al.created_at DESC 
             LIMIT ? OFFSET ?`,
            [...params, parseInt(limit), parseInt(offset)]
        );

        res.json({
            success: true,
            data: logs,
            pagination: {
                total: countRes[0].total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(countRes[0].total / limit)
            }
        });
    } catch (error) {
        console.error('Audit Logs Error:', error);
        res.status(500).json({ success: false, message: 'Error fetching audit logs' });
    }
};

