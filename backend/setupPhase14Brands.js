const pool = require('./config/db');

async function setupPhase14Brands() {
    let connection;
    try {
        connection = await pool.getConnection();
        console.log("Creating brands table...");
        await connection.query(`
            CREATE TABLE IF NOT EXISTS brands (
                id INT AUTO_INCREMENT PRIMARY KEY,
                tenant_id INT NOT NULL,
                name VARCHAR(255) NOT NULL,
                logo_url VARCHAR(255) NULL,
                description TEXT NULL,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
            )
        `);

        console.log("Adding brand_id to products table...");
        try {
            await connection.query('ALTER TABLE products ADD COLUMN brand_id INT NULL;');
            await connection.query('ALTER TABLE products ADD FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE SET NULL;');
        } catch (e) { if (e.code !== 'ER_DUP_FIELDNAME') throw e; }

        console.log("Phase 14.2 Brand DB schema applied successfully.");
    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    } finally {
        if (connection) connection.release();
        process.exit(0);
    }
}
setupPhase14Brands();
