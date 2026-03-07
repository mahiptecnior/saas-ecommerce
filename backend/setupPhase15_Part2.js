const mysql = require('mysql2/promise');
require('dotenv').config();

async function setupPhase15Part2() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST || '127.0.0.1',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'saas_ecom',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    });

    try {
        console.log("Starting Phase 15 Part 2: Advanced Inventory & Purchases DB Setup...");

        // 1. Inventory Batches
        await pool.query(`
            CREATE TABLE IF NOT EXISTS inventory_batches (
                id INT AUTO_INCREMENT PRIMARY KEY,
                tenant_id INT NOT NULL,
                product_id INT NOT NULL,
                variant_id INT,
                warehouse_id INT NOT NULL,
                batch_number VARCHAR(100) NOT NULL,
                expiry_date DATE,
                quantity INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
                FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
                FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE CASCADE,
                FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE CASCADE,
                UNIQUE KEY unique_batch (tenant_id, warehouse_id, product_id, variant_id, batch_number)
            )
        `);
        console.log("-> 'inventory_batches' table created.");

        // 2. Vendor Ledger
        await pool.query(`
            CREATE TABLE IF NOT EXISTS vendor_ledger (
                id INT AUTO_INCREMENT PRIMARY KEY,
                tenant_id INT NOT NULL,
                vendor_id INT NOT NULL,
                type ENUM('dr', 'cr') NOT NULL COMMENT 'dr = we owe vendor (invoice), cr = we paid vendor',
                amount DECIMAL(10, 2) NOT NULL,
                reference VARCHAR(255),
                date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
                FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE
            )
        `);
        console.log("-> 'vendor_ledger' table created.");

        // 3. Purchase Invoices
        await pool.query(`
            CREATE TABLE IF NOT EXISTS purchase_invoices (
                id INT AUTO_INCREMENT PRIMARY KEY,
                tenant_id INT NOT NULL,
                po_id INT NOT NULL,
                vendor_id INT NOT NULL,
                invoice_number VARCHAR(100) NOT NULL,
                total DECIMAL(10, 2) NOT NULL,
                status ENUM('unpaid', 'partial', 'paid') DEFAULT 'unpaid',
                date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                due_date DATE,
                FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
                FOREIGN KEY (po_id) REFERENCES purchase_orders(id) ON DELETE CASCADE,
                FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE
            )
        `);
        console.log("-> 'purchase_invoices' table created.");

        // 4. Purchase Returns (RTV)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS purchase_returns (
                id INT AUTO_INCREMENT PRIMARY KEY,
                tenant_id INT NOT NULL,
                po_id INT NOT NULL,
                reason TEXT,
                status ENUM('pending', 'approved', 'rejected', 'completed') DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
                FOREIGN KEY (po_id) REFERENCES purchase_orders(id) ON DELETE CASCADE
            )
        `);
        console.log("-> 'purchase_returns' table created.");

        console.log("Phase 15 Part 2 DB Setup Completed Successfully.");

    } catch (error) {
        console.error("Error setting up Phase 15 Part 2 DB:", error);
    } finally {
        await pool.end();
    }
}

setupPhase15Part2();
