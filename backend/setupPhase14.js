const pool = require('./config/db');

async function setupPhase14() {
    let connection;
    try {
        connection = await pool.getConnection();
        console.log("Adding GST, Bank Details, and Invoice Template to tenants table...");

        // Add columns individually and handle potential duplicates gracefully
        try {
            await connection.query('ALTER TABLE tenants ADD COLUMN gst_number VARCHAR(255) NULL;');
        } catch (e) { if (e.code !== 'ER_DUP_FIELDNAME') throw e; }

        try {
            await connection.query('ALTER TABLE tenants ADD COLUMN bank_details JSON NULL;');
        } catch (e) { if (e.code !== 'ER_DUP_FIELDNAME') throw e; }

        try {
            await connection.query('ALTER TABLE tenants ADD COLUMN invoice_template VARCHAR(50) DEFAULT "standard";');
        } catch (e) { if (e.code !== 'ER_DUP_FIELDNAME') throw e; }

        console.log("Creating shipping_rules table...");
        await connection.query(`
            CREATE TABLE IF NOT EXISTS shipping_rules (
                id INT AUTO_INCREMENT PRIMARY KEY,
                tenant_id INT NOT NULL,
                name VARCHAR(255) NOT NULL,
                regions JSON NOT NULL,
                rate DECIMAL(10,2) NOT NULL DEFAULT 0.00,
                condition_type ENUM('flat', 'weight', 'price', 'free') DEFAULT 'flat',
                condition_value DECIMAL(10,2) NULL,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
            )
        `);
        console.log("Phase 14.1 DB schema applied successfully.");
    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    } finally {
        if (connection) connection.release();
        process.exit(0);
    }
}
setupPhase14();
