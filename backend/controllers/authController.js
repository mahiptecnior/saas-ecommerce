const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

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

        // Create Tenant
        const [tenantResult] = await connection.query(
            'INSERT INTO tenants (name, subdomain) VALUES (?, ?)',
            [storeName, subdomain]
        );
        const tenantId = tenantResult.insertId;

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create User
        await connection.query(
            'INSERT INTO users (tenant_id, name, email, password, role) VALUES (?, ?, ?, ?, ?)',
            [tenantId, name, email, hashedPassword, 'tenant_owner']
        );

        await connection.commit();
        res.status(201).json({ success: true, message: 'Tenant registered successfully' });
    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ success: false, message: 'Registration failed' });
    } finally {
        connection.release();
    }
};
