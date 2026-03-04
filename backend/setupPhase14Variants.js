const pool = require('./config/db');

async function setupPhase14Variants() {
    let connection;
    try {
        connection = await pool.getConnection();
        console.log("Creating product_variants table...");
        await connection.query(`
            CREATE TABLE IF NOT EXISTS product_variants (
                id INT AUTO_INCREMENT PRIMARY KEY,
                product_id INT NOT NULL,
                variant_sku VARCHAR(100) NULL,
                price DECIMAL(10,2) NULL,
                stock_quantity INT DEFAULT 0,
                attributes_json JSON NOT NULL, -- e.g. {"Size": "L", "Color": "Red"}
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
                UNIQUE KEY unique_product_variant (product_id, variant_sku)
            )
        `);

        console.log("Phase 14.3 Variant DB schema applied successfully.");
    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    } finally {
        if (connection) connection.release();
        process.exit(0);
    }
}
setupPhase14Variants();
