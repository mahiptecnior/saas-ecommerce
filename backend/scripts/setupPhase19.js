const pool = require('../config/db');

async function setupPhase19() {
    try {
        console.log('Starting Phase 19 Database Setup (Multi-Channel & BI Reporting)...');

        // 1. External Channels Table
        console.log('Creating external_channels table...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS external_channels (
                id INT AUTO_INCREMENT PRIMARY KEY,
                tenant_id INT NOT NULL,
                channel_name VARCHAR(100) NOT NULL, -- 'amazon', 'flipkart', 'shopify', 'facebook'
                credentials_json JSON,
                status VARCHAR(50) DEFAULT 'inactive',
                last_sync_at TIMESTAMP NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
            );
        `);
        console.log('✅ Created external_channels table');

        // 2. Channel Sync Logs
        console.log('Creating channel_sync_logs table...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS channel_sync_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                tenant_id INT NOT NULL,
                channel_id INT NOT NULL,
                event_type VARCHAR(100), -- 'inventory_sync', 'order_import'
                status VARCHAR(50), -- 'success', 'failed'
                details TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
                FOREIGN KEY (channel_id) REFERENCES external_channels(id) ON DELETE CASCADE
            );
        `);
        console.log('✅ Created channel_sync_logs table');

        // 3. Scheduled Reports
        console.log('Creating scheduled_reports table...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS scheduled_reports (
                id INT AUTO_INCREMENT PRIMARY KEY,
                tenant_id INT NOT NULL,
                report_type VARCHAR(100), -- 'sales_summary', 'inventory_alert', 'financial_health'
                frequency VARCHAR(50), -- 'daily', 'weekly', 'monthly'
                recipient_emails TEXT, -- comma separated
                last_sent_at TIMESTAMP NULL,
                status VARCHAR(20) DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
            );
        `);
        console.log('✅ Created scheduled_reports table');

        console.log('🎉 Phase 19 Database Setup Complete!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error in Phase 19 setup:', error);
        process.exit(1);
    }
}

setupPhase19();
