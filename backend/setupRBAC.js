const pool = require('./config/db');

async function setupRBAC() {
    try {
        console.log("Setting up RBAC Tables...");

        // 1. Roles table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS roles (
                id INT AUTO_INCREMENT PRIMARY KEY,
                tenant_id INT NOT NULL,
                name VARCHAR(100) NOT NULL,
                description TEXT,
                is_system BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
                UNIQUE KEY unique_tenant_role (tenant_id, name)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);
        console.log("roles table ok.");

        // 2. Role Permissions table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS role_permissions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                role_id INT NOT NULL,
                module_name VARCHAR(100) NOT NULL,
                can_read BOOLEAN DEFAULT FALSE,
                can_write BOOLEAN DEFAULT FALSE,
                can_delete BOOLEAN DEFAULT FALSE,
                FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
                UNIQUE KEY unique_role_module (role_id, module_name)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);
        console.log("role_permissions table ok.");

        // 3. Alter Users table safely
        const [columns] = await pool.query(`SHOW COLUMNS FROM users LIKE 'role_id'`);
        if (columns.length === 0) {
            await pool.query(`
                ALTER TABLE users 
                ADD COLUMN role_id INT NULL,
                ADD FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL;
            `);
            console.log("Added role_id to users table.");
        } else {
            console.log("role_id already exists on users table.");
        }

        console.log("RBAC schema setup completely successfully.");
    } catch (error) {
        console.error("Error setting up RBAC:", error);
    } finally {
        process.exit();
    }
}

setupRBAC();
