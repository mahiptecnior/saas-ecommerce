const pool = require('../config/db');

/**
 * Middleware to enforce Tenant Staff RBAC
 * @param {string} moduleName - The module being accessed (e.g., 'products', 'orders', 'marketing')
 * @param {string} requiredAction - The required action ('read', 'write', 'delete')
 */
const authorizeTenantRole = (moduleName, requiredAction) => {
    return async (req, res, next) => {
        const tenantId = req.tenantId;
        const userId = req.userId;

        if (!tenantId || !userId) {
            return res.status(401).json({ success: false, message: 'Authentication required' });
        }

        try {
            // Get user to check role
            const [users] = await pool.query('SELECT role_id FROM users WHERE id = ? AND tenant_id = ?', [userId, tenantId]);
            if (users.length === 0) return res.status(401).json({ success: false, message: 'Invalid user' });

            const roleId = users[0].role_id;

            // If role_id is null, this is the Store Owner -> Allow all
            if (roleId === null) {
                return next();
            }

            // It's a staff member -> check permissions
            const [perms] = await pool.query(
                'SELECT * FROM role_permissions WHERE role_id = ? AND module_name = ?',
                [roleId, moduleName]
            );

            // If no permission record exists for this module, deny access
            if (perms.length === 0) {
                return res.status(403).json({ success: false, message: `Access denied. No permission configured for module: ${moduleName}` });
            }

            const perm = perms[0];

            // Check the specific action requested
            let isAllowed = false;
            switch (requiredAction) {
                case 'read': isAllowed = perm.can_read; break;
                case 'write': isAllowed = perm.can_write; break;
                case 'delete': isAllowed = perm.can_delete; break;
            }

            if (!isAllowed) {
                return res.status(403).json({ success: false, message: `Access denied. Missing ${requiredAction} permission for module: ${moduleName}` });
            }

            // Access granted
            next();
        } catch (error) {
            console.error('RBAC Error:', error);
            res.status(500).json({ success: false, message: 'Internal Server Error enforcing permissions' });
        }
    };
};

module.exports = authorizeTenantRole;
