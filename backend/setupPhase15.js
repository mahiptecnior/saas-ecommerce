const mysql = require('mysql2/promise');
require('dotenv').config();

async function setupPhase15() {
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
        console.log("Starting Phase 15.1: Inventory & Purchase Management DB Setup...");

        // 1. Warehouses
        await pool.query(`
            CREATE TABLE IF NOT EXISTS warehouses (
                id INT AUTO_INCREMENT PRIMARY KEY,
                tenant_id INT NOT NULL,
                name VARCHAR(255) NOT NULL,
                location VARCHAR(255),
                is_default BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
            )
        `);
        console.log("-> 'warehouses' table created or already exists.");

        // 2. Inventory Levels
        await pool.query(`
            CREATE TABLE IF NOT EXISTS inventory_levels (
                id INT AUTO_INCREMENT PRIMARY KEY,
                tenant_id INT NOT NULL,
                product_id INT NOT NULL,
                variant_id INT,
                warehouse_id INT NOT NULL,
                quantity INT DEFAULT 0,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
                FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
                FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE CASCADE,
                FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE CASCADE,
                UNIQUE KEY unique_inventory (tenant_id, product_id, variant_id, warehouse_id)
            )
        `);
        console.log("-> 'inventory_levels' table created or already exists.");

        // 3. Stock Movements
        await pool.query(`
            CREATE TABLE IF NOT EXISTS stock_movements (
                id INT AUTO_INCREMENT PRIMARY KEY,
                tenant_id INT NOT NULL,
                product_id INT NOT NULL,
                variant_id INT,
                warehouse_id INT NOT NULL,
                type ENUM('in', 'out', 'transfer', 'adjustment') NOT NULL,
                quantity INT NOT NULL,
                reference VARCHAR(255),
                date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
                FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
                FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE CASCADE,
                FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE CASCADE
            )
        `);
        console.log("-> 'stock_movements' table created or already exists.");

        // 4. Vendors
        await pool.query(`
            CREATE TABLE IF NOT EXISTS vendors (
                id INT AUTO_INCREMENT PRIMARY KEY,
                tenant_id INT NOT NULL,
                name VARCHAR(255) NOT NULL,
                contact_name VARCHAR(255),
                email VARCHAR(255),
                phone VARCHAR(50),
                address TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
            )
        `);
        console.log("-> 'vendors' table created or already exists.");

        // 5. Purchase Orders
        await pool.query(`
            CREATE TABLE IF NOT EXISTS purchase_orders (
                id INT AUTO_INCREMENT PRIMARY KEY,
                tenant_id INT NOT NULL,
                vendor_id INT,
                po_number VARCHAR(100) NOT NULL,
                status ENUM('draft', 'sent', 'partially_received', 'received', 'cancelled') DEFAULT 'draft',
                total_amount DECIMAL(10, 2) DEFAULT 0.00,
                date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
                FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE SET NULL,
                UNIQUE KEY unique_po_number (tenant_id, po_number)
            )
        `);
        console.log("-> 'purchase_orders' table created or already exists.");

        // 6. Purchase Order Items
        await pool.query(`
            CREATE TABLE IF NOT EXISTS purchase_order_items (
                id INT AUTO_INCREMENT PRIMARY KEY,
                po_id INT NOT NULL,
                product_id INT NOT NULL,
                variant_id INT,
                quantity INT NOT NULL,
                received_quantity INT DEFAULT 0,
                unit_price DECIMAL(10, 2) NOT NULL,
                FOREIGN KEY (po_id) REFERENCES purchase_orders(id) ON DELETE CASCADE,
                FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
                FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE CASCADE
            )
        `);
        console.log("-> 'purchase_order_items' table created or already exists.");

        // 7. Seed Default Warehouse for existing tenants
        const [tenants] = await pool.query('SELECT id FROM tenants');
        for (const t of tenants) {
            await pool.query(
                'INSERT IGNORE INTO warehouses (tenant_id, name, location, is_default) VALUES (?, ?, ?, ?)',
                [t.id, 'Main Warehouse', 'Headquarters', true]
            );

            // Seed inventory_levels for existing products into the Main Warehouse
            const [mainWh] = await pool.query('SELECT id FROM warehouses WHERE tenant_id = ? AND is_default = TRUE LIMIT 1', [t.id]);
            if (mainWh.length > 0) {
                const whId = mainWh[0].id;
                // Move product inventory
                await pool.query(`
                    INSERT IGNORE INTO inventory_levels (tenant_id, product_id, warehouse_id, quantity)
                    SELECT tenant_id, id, ?, inventory_quantity FROM products WHERE tenant_id = ?
                `, [whId, t.id]);

                // Move variant inventory
                await pool.query(`
                    INSERT IGNORE INTO inventory_levels (tenant_id, product_id, variant_id, warehouse_id, quantity)
                    SELECT p.tenant_id, pv.product_id, pv.id, ?, pv.stock_quantity 
                    FROM product_variants pv 
                    JOIN products p ON p.id = pv.product_id 
                    WHERE p.tenant_id = ?
                `, [whId, t.id]);
            }
        }
        console.log("-> Seeded default warehouses and migrated existing product stock.");

        console.log("Phase 15 DB Setup Completed Successfully.");

    } catch (error) {
        console.error("Error setting up Phase 15 DB:", error);
    } finally {
        await pool.end();
    }
}

setupPhase15();
