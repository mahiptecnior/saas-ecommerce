const jwt = require('jsonwebtoken');

const tenantContext = (req, res, next) => {
    // 1. Check for tenant_id in headers (for API requests)
    // 2. Check for tenant_id from JWT payload (for authenticated requests)

    const token = req.headers.authorization?.split(' ')[1];

    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.tenantId = decoded.tenant_id;
            req.user = decoded;
        } catch (err) {
            // Token exists but of invalid or expired - we don't block here, 
            // let auth middleware handle protected routes
        }
    }

    // Fallback to X-Tenant-Id header if present (useful for cross-tenant API calls or development)
    if (!req.tenantId && req.headers['x-tenant-id']) {
        req.tenantId = req.headers['x-tenant-id'];
    }

    // For Super Admin, tenantId might be null or specifically set to null
    if (req.user && req.user.role === 'super_admin') {
        // Super admins can switch contexts - default to null or provided header
        if (req.headers['x-switch-tenant-id']) {
            req.tenantId = req.headers['x-switch-tenant-id'];
        }
    }

    next();
};

module.exports = tenantContext;
