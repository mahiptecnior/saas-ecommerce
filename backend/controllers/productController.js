const pool = require('../config/db');
const logger = require('../utils/logger');

exports.getProducts = async (req, res) => {
    const tenantId = req.tenantId;
    if (!tenantId) {
        return res.status(400).json({ success: false, message: 'Tenant context missing' });
    }

    try {
        const [rows] = await pool.query('SELECT * FROM products WHERE tenant_id = ?', [tenantId]);
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching products' });
    }
};

exports.createProduct = async (req, res) => {
    const tenantId = req.tenantId;
    const { name, description, price, sku, inventory_quantity, low_stock_threshold, tags, category_id, variants } = req.body;

    if (!tenantId) {
        return res.status(400).json({ success: false, message: 'Tenant context missing' });
    }

    try {
        // Enforce product limits based on active subscription
        const [planInfo] = await pool.query(
            `SELECT p.product_limit 
             FROM subscriptions s
             JOIN plans p ON s.plan_id = p.id
             WHERE s.tenant_id = ? AND s.status = 'active'
             LIMIT 1`,
            [tenantId]
        );

        if (planInfo.length > 0) {
            const limit = planInfo[0].product_limit;
            if (limit !== -1) {
                // Check current product count
                const [countInfo] = await pool.query('SELECT COUNT(*) as currentCount FROM products WHERE tenant_id = ?', [tenantId]);
                const currentCount = countInfo[0].currentCount;

                if (currentCount >= limit) {
                    return res.status(403).json({
                        success: false,
                        errorCode: 'LIMIT_REACHED',
                        message: `Product limit reached. Your plan allows a maximum of ${limit} products.`
                    });
                }
            }
        }

        const [result] = await pool.query(
            'INSERT INTO products (tenant_id, name, description, price, sku, inventory_quantity, low_stock_threshold, tags, category_id, variants) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [tenantId, name, description, price, sku, inventory_quantity || 0, low_stock_threshold || 5, tags, category_id || null, variants ? JSON.stringify(variants) : null]
        );
        const productId = result.insertId;
        await logger.logAction(tenantId, req.userId, 'PRODUCT_CREATE', { productId, name }, req.ip);
        res.status(201).json({ success: true, data: { id: productId, name } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error creating product' });
    }
};

exports.getProduct = async (req, res) => {
    const tenantId = req.tenantId;
    const { id } = req.params;

    try {
        const [rows] = await pool.query('SELECT * FROM products WHERE id = ? AND tenant_id = ?', [id, tenantId]);
        if (rows.length === 0) return res.status(404).json({ success: false, message: 'Product not found' });
        res.json({ success: true, data: rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching product' });
    }
};

exports.updateProduct = async (req, res) => {
    const tenantId = req.tenantId;
    const { id } = req.params;
    const { name, description, price, sku, inventory_quantity, low_stock_threshold, tags, status, category_id, variants } = req.body;

    try {
        await pool.query(
            'UPDATE products SET name = ?, description = ?, price = ?, sku = ?, inventory_quantity = ?, low_stock_threshold = ?, tags = ?, status = ?, category_id = ?, variants = ? WHERE id = ? AND tenant_id = ?',
            [name, description, price, sku, inventory_quantity, low_stock_threshold, tags, status, category_id || null, variants ? JSON.stringify(variants) : null, id, tenantId]
        );
        res.json({ success: true, message: 'Product updated' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error updating product' });
    }
};

exports.deleteProduct = async (req, res) => {
    const tenantId = req.tenantId;
    const { id } = req.params;

    try {
        await pool.query('DELETE FROM products WHERE id = ? AND tenant_id = ?', [id, tenantId]);
        await logger.logAction(tenantId, req.userId, 'PRODUCT_DELETE', { productId: id }, req.ip);
        res.json({ success: true, message: 'Product deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error deleting product' });
    }
};
