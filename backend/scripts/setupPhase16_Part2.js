const pool = require('../config/db');

async function setupPhase16Part2() {
    try {
        console.log('Starting Phase 16 Part 2 Database Setup (GST & Recurring Invoices)...');

        // 1. Add Tax support to products
        console.log('Updating products table for GST...');
        try {
            await pool.query(`
                ALTER TABLE products 
                ADD COLUMN IF NOT EXISTS tax_rate DECIMAL(5, 2) DEFAULT 0.00
            `);
            console.log('✅ Added tax_rate to products');
        } catch (err) {
            console.log('⚠️ Note: could not add tax_rate to products: ' + err.message);
        }

        // Add Tax to orders
        console.log('Updating orders table for GST...');
        try {
            await pool.query(`
                ALTER TABLE orders 
                ADD COLUMN IF NOT EXISTS tax_amount DECIMAL(10, 2) DEFAULT 0.00
            `);
            console.log('✅ Added tax_amount to orders');
        } catch (err) {
            console.log('⚠️ Note: could not add tax_amount to orders: ' + err.message);
        }

        // 2. Recurring Invoices Table
        console.log('Creating recurring_invoices table...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS recurring_invoices (
                id SERIAL PRIMARY KEY,
                tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
                customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
                name VARCHAR(255) NOT NULL,
                frequency VARCHAR(50) NOT NULL, -- 'weekly', 'monthly', 'yearly'
                amount DECIMAL(10, 2) NOT NULL,
                next_invoice_date DATE NOT NULL,
                status VARCHAR(50) DEFAULT 'active', -- 'active', 'paused', 'cancelled'
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ Created recurring_invoices table');

        console.log('🎉 Phase 16 Part 2 Database Setup Complete!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error in Phase 16 setup:', error);
        process.exit(1);
    }
}

setupPhase16Part2();
