const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const mailService = require('../utils/mailService');

exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (rows.length === 0) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const user = rows[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role, tenant_id: user.tenant_id },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        await logger.logAction(user.tenant_id, user.id, 'LOGIN', { email: user.email }, req.ip);

        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                tenant_id: user.tenant_id
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.register = async (req, res) => {
    const { name, email, password, storeName, subdomain } = req.body;

    // Registration logic usually involves:
    // 1. Create Tenant
    // 2. Create User (tenant_owner) tied to that tenant
    // 3. Assign default plan & modules

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // Create Tenant (pending admin approval)
        const [tenantResult] = await connection.query(
            'INSERT INTO tenants (name, subdomain, approval_status) VALUES (?, ?, ?)',
            [storeName, subdomain, 'pending']
        );
        const tenantId = tenantResult.insertId;

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create User
        await connection.query(
            'INSERT INTO users (tenant_id, name, email, password, role) VALUES (?, ?, ?, ?, ?)',
            [tenantId, name, email, hashedPassword, 'tenant_owner']
        );

        // Auto-assign free/trial plan if available
        const [freePlans] = await connection.query(
            'SELECT id, trial_days FROM plans WHERE price_monthly = 0 OR trial_days > 0 ORDER BY trial_days DESC LIMIT 1'
        );
        if (freePlans.length > 0) {
            const plan = freePlans[0];
            const trialDays = plan.trial_days || 30;
            const status = plan.trial_days > 0 ? 'trial' : 'active';
            await connection.query(
                `INSERT INTO subscriptions (tenant_id, plan_id, billing_cycle, start_date, end_date, status) 
                 VALUES (?, ?, 'monthly', CURDATE(), DATE_ADD(CURDATE(), INTERVAL ? DAY), ?)`,
                [tenantId, plan.id, trialDays, status]
            );

            // Provision plan modules
            const [planModules] = await connection.query('SELECT module_id FROM plan_modules WHERE plan_id = ?', [plan.id]);
            if (planModules.length > 0) {
                const vals = planModules.map(pm => [tenantId, pm.module_id]);
                await connection.query('INSERT IGNORE INTO tenant_modules (tenant_id, module_id) VALUES ?', [vals]);
            }
        }

        await connection.commit();

        // Send Welcome Email
        await mailService.sendEmail(
            email,
            'Welcome to Nazmart!',
            `Hello ${name}, your store ${storeName} has been created successfully.`,
            `<h1>Welcome to Nazmart!</h1><p>Hello ${name},</p><p>Your store <strong>${storeName}</strong> has been created successfully. You can access it at: http://${subdomain}.nazmart.com</p>`
        );

        res.status(201).json({ success: true, message: 'Tenant registered successfully' });
    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ success: false, message: 'Registration failed' });
    } finally {
        if (connection) connection.release();
    }
};

exports.updateProfile = async (req, res) => {
    const userId = req.user ? req.user.id : req.body.id;
    if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized. User ID not found.' });
    }

    const { name, email, password } = req.body;
    let query = 'UPDATE users SET name = ?, email = ?';
    let params = [name, email];

    try {
        if (password && password.trim() !== '') {
            const hashedPassword = await bcrypt.hash(password, 10);
            query += ', password = ?';
            params.push(hashedPassword);
        }

        query += ' WHERE id = ?';
        params.push(userId);

        await pool.query(query, params);

        res.json({ success: true, message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Update Profile Error:', error);
        res.status(500).json({ success: false, message: 'Error updating profile' });
    }
};
