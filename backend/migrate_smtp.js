const pool = require('./config/db');

async function migrate() {
    try {
        console.log('Starting SMTP Migration...');

        await pool.query(`
            ALTER TABLE store_settings 
            ADD COLUMN IF NOT EXISTS smtp_host VARCHAR(255) DEFAULT NULL,
            ADD COLUMN IF NOT EXISTS smtp_port INT DEFAULT NULL,
            ADD COLUMN IF NOT EXISTS smtp_user VARCHAR(255) DEFAULT NULL,
            ADD COLUMN IF NOT EXISTS smtp_pass VARCHAR(255) DEFAULT NULL,
            ADD COLUMN IF NOT EXISTS smtp_from VARCHAR(255) DEFAULT NULL
        `);

        console.log('Migration successful: SMTP fields added to store_settings');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
