const pool = require('../config/db');

exports.getRoles = async (req, res) => {
    const tenantId = req.tenantId;
    try {
        const [roles] = await pool.query('SELECT * FROM roles WHERE tenant_id = ?', [tenantId]);

        // Fetch permissions for each role
        for (let i = 0; i < roles.length; i++) {
            const [perms] = await pool.query('SELECT module_name, can_read, can_write, can_delete FROM role_permissions WHERE role_id = ?', [roles[i].id]);
            roles[i].permissions = perms;
        }

        res.json({ success: true, data: roles });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching roles' });
    }
};

exports.createRole = async (req, res) => {
    const tenantId = req.tenantId;
    const { name, description, permissions } = req.body; // permissions is an array of objects
    try {
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            const [result] = await connection.query(
                'INSERT INTO roles (tenant_id, name, description) VALUES (?, ?, ?)',
                [tenantId, name, description]
            );
            const roleId = result.insertId;

            if (permissions && Array.isArray(permissions)) {
                for (const p of permissions) {
                    await connection.query(
                        'INSERT INTO role_permissions (role_id, module_name, can_read, can_write, can_delete) VALUES (?, ?, ?, ?, ?)',
                        [roleId, p.module_name, p.can_read || false, p.can_write || false, p.can_delete || false]
                    );
                }
            }

            await connection.commit();
            res.status(201).json({ success: true, message: 'Role created', data: { id: roleId } });
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Create Role Error:', error);
        res.status(500).json({ success: false, message: 'Error creating role' });
    }
};

exports.updateRole = async (req, res) => {
    const tenantId = req.tenantId;
    const { id } = req.params;
    const { name, description, permissions } = req.body;

    try {
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            await connection.query(
                'UPDATE roles SET name = ?, description = ? WHERE id = ? AND tenant_id = ? AND is_system = FALSE',
                [name, description, id, tenantId]
            );

            // Replace all permissions
            if (permissions && Array.isArray(permissions)) {
                await connection.query('DELETE FROM role_permissions WHERE role_id = ?', [id]);
                for (const p of permissions) {
                    await connection.query(
                        'INSERT INTO role_permissions (role_id, module_name, can_read, can_write, can_delete) VALUES (?, ?, ?, ?, ?)',
                        [id, p.module_name, p.can_read || false, p.can_write || false, p.can_delete || false]
                    );
                }
            }

            await connection.commit();
            res.json({ success: true, message: 'Role updated' });
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error updating role' });
    }
};

exports.deleteRole = async (req, res) => {
    const tenantId = req.tenantId;
    const { id } = req.params;

    try {
        // Only allow deleting non-system roles
        const [result] = await pool.query('DELETE FROM roles WHERE id = ? AND tenant_id = ? AND is_system = FALSE', [id, tenantId]);
        if (result.affectedRows === 0) {
            return res.status(400).json({ success: false, message: 'Cannot delete a system role or role does not exist' });
        }
        res.json({ success: true, message: 'Role deleted' });
    } catch (error) {
        // Foreign key constraint on users might fail if users are assigned to it
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(400).json({ success: false, message: 'Cannot delete role because staff members are assigned to it.' });
        }
        res.status(500).json({ success: false, message: 'Error deleting role' });
    }
};
