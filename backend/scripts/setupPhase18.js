const pool = require('../config/db');

async function setupPhase18() {
    try {
        console.log('Starting Phase 18 Database Setup (CRM, Marketing, & Helpdesk)...');

        // 1. CRM Leads Table
        console.log('Creating crm_leads table...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS crm_leads (
                id SERIAL PRIMARY KEY,
                tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255),
                phone VARCHAR(50),
                stage VARCHAR(50) DEFAULT 'new', -- 'new', 'contacted', 'proposal', 'won', 'lost'
                value DECIMAL(15, 2) DEFAULT 0.00,
                source VARCHAR(100),
                notes TEXT,
                assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ Created crm_leads table');

        // 2. Loyalty Points Table
        console.log('Creating loyalty_points table...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS loyalty_points (
                id SERIAL PRIMARY KEY,
                tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
                customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
                points INTEGER NOT NULL,
                transaction_type VARCHAR(50), -- 'earn', 'redeem', 'adjustment'
                reference_id VARCHAR(100), -- order_id or manual_ref
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ Created loyalty_points table');

        // 3. Affiliate Profiles Table
        console.log('Creating affiliate_profiles table...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS affiliate_profiles (
                id SERIAL PRIMARY KEY,
                tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
                customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
                referral_code VARCHAR(50) UNIQUE NOT NULL,
                commission_rate DECIMAL(5, 2) DEFAULT 0.00,
                status VARCHAR(20) DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ Created affiliate_profiles table');

        // 4. FAQs Table
        console.log('Creating faqs table...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS faqs (
                id SERIAL PRIMARY KEY,
                tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
                question TEXT NOT NULL,
                answer TEXT NOT NULL,
                category VARCHAR(100),
                is_published BOOLEAN DEFAULT TRUE,
                display_order INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ Created faqs table');

        // 5. Update tickets for SLA
        console.log('Updating tickets table...');
        await pool.query(`
            ALTER TABLE tickets 
            ADD COLUMN IF NOT EXISTS sla_deadline TIMESTAMP,
            ADD COLUMN IF NOT EXISTS assigned_agent_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
        `);
        console.log('✅ Updated tickets table');

        console.log('🎉 Phase 18 Database Setup Complete!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error in Phase 18 setup:', error);
        process.exit(1);
    }
}

setupPhase18();
