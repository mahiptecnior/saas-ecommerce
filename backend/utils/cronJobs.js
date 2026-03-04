const cron = require('node-cron');
const pool = require('../config/db');

/**
 * Runs daily at midnight:
 * 1. Auto-renew subscriptions with auto_renew = true
 * 2. Expire subscriptions with auto_renew = false (or trial subs)
 * 3. Revoke tenant modules for expired tenants
 */
const startCronJobs = () => {
    cron.schedule('0 0 * * *', async () => {
        console.log('[CRON] Running subscription check...');
        let connection;
        try {
            connection = await pool.getConnection();
            await connection.beginTransaction();

            // 1. Auto-renew: extend end_date by 1 month for auto_renew = true
            const [renewSubs] = await connection.query(
                `SELECT id, tenant_id, plan_id, billing_cycle FROM subscriptions 
                 WHERE status = 'active' AND auto_renew = true AND end_date < CURDATE()`
            );

            for (const sub of renewSubs) {
                const interval = sub.billing_cycle === 'yearly' ? 'INTERVAL 1 YEAR' : 'INTERVAL 1 MONTH';
                await connection.query(
                    `UPDATE subscriptions SET start_date = CURDATE(), end_date = DATE_ADD(CURDATE(), ${interval}) WHERE id = ?`,
                    [sub.id]
                );
                console.log(`[CRON] Auto-renewed subscription ${sub.id} for tenant ${sub.tenant_id}`);
            }

            // 2. Expire non-auto-renew active subs + all trial subs past end_date
            const [expiredSubs] = await connection.query(
                `SELECT id, tenant_id FROM subscriptions 
                 WHERE (status = 'active' AND auto_renew = false AND end_date < CURDATE())
                    OR (status = 'trial' AND end_date < CURDATE())`
            );

            if (expiredSubs.length > 0) {
                const expiredIds = expiredSubs.map(s => s.id);
                await connection.query(
                    `UPDATE subscriptions SET status = 'expired' WHERE id IN (?)`,
                    [expiredIds]
                );

                // 3. Revoke modules for expired tenants
                const tenantIds = expiredSubs.map(s => s.tenant_id);
                await connection.query(
                    `DELETE FROM tenant_modules WHERE tenant_id IN (?)`,
                    [tenantIds]
                );

                console.log(`[CRON] Expired ${expiredSubs.length} subscription(s): tenants ${tenantIds.join(', ')}`);
            }

            if (renewSubs.length === 0 && expiredSubs.length === 0) {
                console.log('[CRON] No subscriptions to process.');
            }

            await connection.commit();
        } catch (error) {
            if (connection) await connection.rollback();
            console.error('[CRON] Subscription check error:', error);
        } finally {
            if (connection) connection.release();
        }
    });

    console.log('[CRON] Subscription expiry cron job scheduled (daily at midnight).');
};

module.exports = { startCronJobs };
