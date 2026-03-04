const seedSystemRoles = async (connection, tenantId) => {
    const defaultRoles = [
        {
            name: 'Sales Manager',
            description: 'Manages incoming orders and sales reports.',
            permissions: [
                { module: 'orders', read: true, write: true, del: false },
                { module: 'products', read: true, write: false, del: false },
                { module: 'marketing', read: true, write: false, del: false }
            ]
        },
        {
            name: 'Inventory Manager',
            description: 'Manages product catalog and stock levels.',
            permissions: [
                { module: 'products', read: true, write: true, del: true },
                { module: 'orders', read: true, write: false, del: false }
            ]
        },
        {
            name: 'Accountant',
            description: 'Manages expenses, income, and financial settings.',
            permissions: [
                { module: 'accounts', read: true, write: true, del: true },
                { module: 'orders', read: true, write: false, del: false }
            ]
        },
        {
            name: 'Marketing Executive',
            description: 'Manages coupons and campaigns.',
            permissions: [
                { module: 'marketing', read: true, write: true, del: true },
                { module: 'products', read: true, write: false, del: false }
            ]
        },
        {
            name: 'Support Executive',
            description: 'Handles customer support tickets.',
            permissions: [
                { module: 'support', read: true, write: true, del: true },
                { module: 'orders', read: true, write: false, del: false }
            ]
        }
    ];

    for (const role of defaultRoles) {
        // Create the role
        const [roleResult] = await connection.query(
            'INSERT INTO roles (tenant_id, name, description, is_system) VALUES (?, ?, ?, TRUE)',
            [tenantId, role.name, role.description]
        );
        const roleId = roleResult.insertId;

        // Add permissions
        for (const perm of role.permissions) {
            await connection.query(
                'INSERT INTO role_permissions (role_id, module_name, can_read, can_write, can_delete) VALUES (?, ?, ?, ?, ?)',
                [roleId, perm.module, perm.read, perm.write, perm.del]
            );
        }
    }
};

module.exports = seedSystemRoles;
