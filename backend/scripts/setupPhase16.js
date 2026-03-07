const pool = require('../config/db');

async function setupPhase16() {
    try {
        console.log('Starting Phase 16 Database Setup (Advanced Sales & Billing)...');

        // 1. Update Customers Table to include 'tier'
        console.log('Updating customers table...');
        try {
            await pool.query(`
                ALTER TABLE customers 
                ADD COLUMN IF NOT EXISTS tier VARCHAR(50) DEFAULT 'retail'
            `);
            console.log('✅ Added tier to customers');
        } catch (err) {
            console.log('⚠️ Note: could not add tier to customers (might already exist): ' + err.message);
        }

        // 2. B2B Pricing Table
        console.log('Creating b2b_pricing table...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS b2b_pricing (
                id SERIAL PRIMARY KEY,
                tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
                variant_id INTEGER REFERENCES product_variants(id) ON DELETE CASCADE,
                tier VARCHAR(50) NOT NULL,
                price DECIMAL(10, 2) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(tenant_id, variant_id, tier)
            );
        `);
        console.log('✅ Created b2b_pricing table');

        // 3. Update Orders Table to include 'source'
        console.log('Updating orders table...');
        try {
            await pool.query(`
                ALTER TABLE orders 
                ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'web'
            `);
            console.log('✅ Added source to orders');
        } catch (err) {
            console.log('⚠️ Note: could not add source to orders (might already exist): ' + err.message);
        }

        // 4. Billing Documents Table
        console.log('Creating billing_documents table...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS billing_documents (
                id SERIAL PRIMARY KEY,
                tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
                order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
                customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
                document_type VARCHAR(50) NOT NULL, -- 'invoice', 'proforma', 'credit_note', 'debit_note'
                document_number VARCHAR(100) NOT NULL,
                total_amount DECIMAL(10, 2) NOT NULL,
                status VARCHAR(50) DEFAULT 'draft',
                issue_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                due_date TIMESTAMP,
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ Created billing_documents table');

        console.log('🎉 Phase 16 Database Setup Complete!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error in Phase 16 setup:', error);
        process.exit(1);
    }
}

setupPhase16();
