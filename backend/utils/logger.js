const pool = require('../config/db');

/**
 * Logs an action to the audit_logs table.
 * @param {number|null} tenantId - The tenant ID (null for platform actions).
 * @param {number|null} userId - The ID of the user performing the action.
 * @param {string} action - Descriptive action name (e.g., 'LOGIN', 'PRODUCT_CREATE').
 * @param {object|string} details - Additional details about the action.
 * @param {string} ipAddress - The IP address of the requester.
 */
exports.logAction = async (tenantId, userId, action, details, ipAddress = '') => {
    try {
        await pool.query(
            'INSERT INTO audit_logs (tenant_id, user_id, action, details, ip_address) VALUES (?, ?, ?, ?, ?)',
            [
                tenantId || null,
                userId || null,
                action,
                typeof details === 'object' ? JSON.stringify(details) : details,
                ipAddress
            ]
        );
    } catch (error) {
        console.error('Audit Log Error:', error);
    }
};
