const pool = require('../config/db');

async function setupPhase17() {
    try {
        console.log('Starting Phase 17 Database Setup (Core Accounting & Finance)...');

        // 1. Chart of Accounts Table
        console.log('Creating accounts table...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS accounts (
                id SERIAL PRIMARY KEY,
                tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
                name VARCHAR(255) NOT NULL,
                code VARCHAR(50) NOT NULL,
                type VARCHAR(50) NOT NULL, -- 'asset', 'liability', 'equity', 'revenue', 'expense'
                parent_id INTEGER REFERENCES accounts(id) ON DELETE SET NULL,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(tenant_id, code)
            );
        `);
        console.log('✅ Created accounts table');

        // 2. Journals Table
        console.log('Creating journals table...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS journals (
                id SERIAL PRIMARY KEY,
                tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
                description TEXT,
                reference VARCHAR(255),
                date DATE NOT NULL,
                status VARCHAR(50) DEFAULT 'posted', -- 'draft', 'posted'
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ Created journals table');

        // 3. Journal Entries Table (Double-Entry)
        console.log('Creating journal_entries table...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS journal_entries (
                id SERIAL PRIMARY KEY,
                tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
                journal_id INTEGER REFERENCES journals(id) ON DELETE CASCADE,
                account_id INTEGER REFERENCES accounts(id) ON DELETE CASCADE,
                debit DECIMAL(15, 2) DEFAULT 0.00,
                credit DECIMAL(15, 2) DEFAULT 0.00,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ Created journal_entries table');

        // 4. Bank Reconciliations Table
        console.log('Creating bank_reconciliations table...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS bank_reconciliations (
                id SERIAL PRIMARY KEY,
                tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
                account_id INTEGER REFERENCES accounts(id) ON DELETE CASCADE,
                bank_balance DECIMAL(15, 2) NOT NULL,
                statement_date DATE NOT NULL,
                status VARCHAR(50) DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ Created bank_reconciliations table');

        console.log('🎉 Phase 17 Database Setup Complete!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error in Phase 17 setup:', error);
        process.exit(1);
    }
}

setupPhase17();
