const pool = require('../config/db');
const bcrypt = require('bcryptjs');

exports.getStaff = async (req, res) => {
    const tenantId = req.tenantId;
    try {
        const [users] = await pool.query(
            'SELECT u.id, u.name, u.email, u.role_id, r.name as role_name, u.created_at FROM users u LEFT JOIN roles r ON u.role_id = r.id WHERE u.tenant_id = ? AND u.role != "super_admin"',
            [tenantId]
        );
        res.json({ success: true, data: users });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching staff' });
    }
};

exports.addStaff = async (req, res) => {
    const tenantId = req.tenantId;
    const { name, email, password, role_id } = req.body;

    try {
        // Enforce staff limits
        const [planInfo] = await pool.query(
            `SELECT p.staff_limit 
             FROM subscriptions s
             JOIN plans p ON s.plan_id = p.id
             WHERE s.tenant_id = ? AND s.status = 'active'
             LIMIT 1`,
            [tenantId]
        );

        if (planInfo.length > 0 && planInfo[0].staff_limit !== -1) {
            const limit = planInfo[0].staff_limit;
            const [countInfo] = await pool.query('SELECT COUNT(*) as count FROM users WHERE tenant_id = ?', [tenantId]);
            if (countInfo[0].count >= limit) {
                return res.status(403).json({ success: false, message: `Staff limit reached (${limit}).` });
            }
        }

        const [existing] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (existing.length > 0) return res.status(400).json({ success: false, message: 'Email already exists' });

        // Ensure role belongs to tenant
        if (role_id) {
            const [role] = await pool.query('SELECT id FROM roles WHERE id = ? AND tenant_id = ?', [role_id, tenantId]);
            if (role.length === 0) return res.status(400).json({ success: false, message: 'Invalid role' });
        }

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        await pool.query(
            'INSERT INTO users (tenant_id, name, email, password, role, role_id) VALUES (?, ?, ?, ?, ?, ?)',
            [tenantId, name, email, hash, 'tenant_admin', role_id || null]
        );
        res.status(201).json({ success: true, message: 'Staff member added' });
    } catch (error) {
        console.error('Staff Add Error:', error);
        res.status(500).json({ success: false, message: 'Error adding staff' });
    }
};

exports.updateStaff = async (req, res) => {
    const tenantId = req.tenantId;
    const { id } = req.params;
    const { name, role_id } = req.body; // Can't edit email easily, requires more verification

    try {
        if (role_id) {
            const [role] = await pool.query('SELECT id FROM roles WHERE id = ? AND tenant_id = ?', [role_id, tenantId]);
            if (role.length === 0) return res.status(400).json({ success: false, message: 'Invalid role' });
        }

        await pool.query('UPDATE users SET name = ?, role_id = ? WHERE id = ? AND tenant_id = ?', [name, role_id || null, id, tenantId]);
        res.json({ success: true, message: 'Staff updated' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error updating staff' });
    }
};

exports.deleteStaff = async (req, res) => {
    const tenantId = req.tenantId;
    const { id } = req.params;
    const userId = req.userId; // the person making the request

    try {
        if (id == userId) return res.status(400).json({ success: false, message: 'Cannot delete yourself' });
        await pool.query('DELETE FROM users WHERE id = ? AND tenant_id = ?', [id, tenantId]);
        res.json({ success: true, message: 'Staff deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error deleting staff' });
    }
};
