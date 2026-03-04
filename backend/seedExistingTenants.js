const pool = require('./config/db');
const seedSystemRoles = require('./utils/seedRoles');

async function seedExisting() {
    try {
        const [tenants] = await pool.query('SELECT id, name FROM tenants');
        console.log(`Found ${tenants.length} existing tenants to seed.`);

        for (const tenant of tenants) {
            // Check if roles already exist
            const [existingRoles] = await pool.query('SELECT count(*) as count FROM roles WHERE tenant_id = ?', [tenant.id]);
            if (existingRoles[0].count === 0) {
                const connection = await pool.getConnection();
                try {
                    await connection.beginTransaction();
                    await seedSystemRoles(connection, tenant.id);
                    await connection.commit();
                    console.log(`Seeded roles for tenant: ${tenant.name}`);
                } catch (err) {
                    await connection.rollback();
                    console.error(`Error seeding tenant ${tenant.name}:`, err);
                } finally {
                    connection.release();
                }
            } else {
                console.log(`Roles already exist for tenant: ${tenant.name}, skipping.`);
            }
        }
        console.log("Done.");
    } catch (error) {
        console.error("Critical error:", error);
    } finally {
        process.exit();
    }
}

seedExisting();
