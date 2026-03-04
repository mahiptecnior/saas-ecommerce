const pool = require('./config/db');

async function setupPhase14Reviews() {
    let connection;
    try {
        connection = await pool.getConnection();
        console.log("Creating product_reviews table...");
        await connection.query(`
            CREATE TABLE IF NOT EXISTS product_reviews (
                id INT AUTO_INCREMENT PRIMARY KEY,
                tenant_id INT NOT NULL,
                product_id INT NOT NULL,
                customer_name VARCHAR(255) NOT NULL,
                customer_email VARCHAR(255) NULL,
                rating INT NOT NULL DEFAULT 5,
                comment TEXT NULL,
                status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
                FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
            )
        `);

        console.log("Phase 14.5 Review DB schema applied successfully.");
    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    } finally {
        if (connection) connection.release();
        process.exit(0);
    }
}
setupPhase14Reviews();
