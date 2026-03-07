const jwt = require('jsonwebtoken');

/**
 * Middleware to verify JWT token and populate req.user.
 * Returns 401 if no token or invalid token.
 */
exports.verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        req.tenantId = decoded.tenant_id;
        next();
    } catch (err) {
        return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
    }
};

/**
 * Middleware factory to restrict access to specific roles.
 * Usage: authorize('super_admin', 'tenant_owner')
 */
exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ success: false, message: 'Forbidden. Insufficient permissions.' });
        }
        next();
    };
};

/**
 * Alternative for array-based roles (used in recent ERP modules).
 */
exports.authorizeTenantRole = (roles) => {
    return (req, res, next) => {
        // req.user.role may be undefined for legacy 'tenant_owner' checks if not set.
        // We'll treat empty string or 'admin' as high-level access.
        const userRole = req.user.role || '';
        if (!roles.includes(userRole) && !roles.includes('')) {
            return res.status(403).json({ success: false, message: 'Forbidden. Role not authorized.' });
        }
        next();
    };
};
