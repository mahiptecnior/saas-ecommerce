const pool = require('../config/db');
const logger = require('../utils/logger');

exports.getProducts = async (req, res) => {
    const tenantId = req.tenantId;
    if (!tenantId) {
        return res.status(400).json({ success: false, message: 'Tenant context missing' });
    }

    try {
        const [rows] = await pool.query(`
            SELECT p.*, b.name as brand_name,
            (SELECT JSON_ARRAYAGG(JSON_OBJECT(
                'id', pv.id, 
                'variant_sku', pv.variant_sku, 
                'price', pv.price, 
                'stock_quantity', pv.stock_quantity, 
                'attributes_json', pv.attributes_json
            )) FROM product_variants pv WHERE pv.product_id = p.id) as variants
            FROM products p 
            LEFT JOIN brands b ON p.brand_id = b.id 
            WHERE p.tenant_id = ?
        `, [tenantId]);
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Error fetching products', error);
        res.status(500).json({ success: false, message: 'Error fetching products' });
    }
};

exports.createProduct = async (req, res) => {
    const tenantId = req.tenantId;
    const { name, description, price, sku, inventory_quantity, low_stock_threshold, tags, category_id, brand_id, variants } = req.body;

    if (!tenantId) {
        return res.status(400).json({ success: false, message: 'Tenant context missing' });
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Enforce product limits
        const [planInfo] = await connection.query(
            "SELECT p.product_limit FROM subscriptions s JOIN plans p ON s.plan_id = p.id WHERE s.tenant_id = ? AND s.status = 'active' LIMIT 1",
            [tenantId]
        );

        if (planInfo.length > 0 && planInfo[0].product_limit !== -1) {
            const [countInfo] = await connection.query('SELECT COUNT(*) as currentCount FROM products WHERE tenant_id = ?', [tenantId]);
            if (countInfo[0].currentCount >= planInfo[0].product_limit) {
                await connection.rollback();
                return res.status(403).json({ success: false, errorCode: 'LIMIT_REACHED', message: `Product limit reached.` });
            }
        }

        // 2. Insert Main Product
        const [result] = await connection.query(
            'INSERT INTO products (tenant_id, name, description, price, sku, inventory_quantity, low_stock_threshold, tags, category_id, brand_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [tenantId, name, description, price, sku, inventory_quantity || 0, low_stock_threshold || 5, tags, category_id || null, brand_id || null]
        );
        const productId = result.insertId;

        // 3. Insert Variants if any
        if (variants && Array.isArray(variants) && variants.length > 0) {
            for (const v of variants) {
                await connection.query(
                    'INSERT INTO product_variants (product_id, variant_sku, price, stock_quantity, attributes_json) VALUES (?, ?, ?, ?, ?)',
                    [productId, v.variant_sku || null, v.price || price, v.stock_quantity || 0, JSON.stringify(v.attributes_json || {})]
                );
            }
        }

        await connection.commit();
        await logger.logAction(tenantId, req.userId, 'PRODUCT_CREATE', { productId, name }, req.ip);
        res.status(201).json({ success: true, data: { id: productId, name } });
    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ success: false, message: 'Error creating product' });
    } finally {
        connection.release();
    }
};

exports.getProduct = async (req, res) => {
    const tenantId = req.tenantId;
    const { id } = req.params;

    try {
        const [rows] = await pool.query(`
            SELECT p.*, (SELECT JSON_ARRAYAGG(JSON_OBJECT('id', id, 'variant_sku', variant_sku, 'price', price, 'stock_quantity', stock_quantity, 'attributes_json', attributes_json)) FROM product_variants WHERE product_id = p.id) as variants
            FROM products p WHERE p.id = ? AND p.tenant_id = ?
        `, [id, tenantId]);
        if (rows.length === 0) return res.status(404).json({ success: false, message: 'Product not found' });
        res.json({ success: true, data: rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching product' });
    }
};

exports.updateProduct = async (req, res) => {
    const tenantId = req.tenantId;
    const { id } = req.params;
    const { name, description, price, sku, inventory_quantity, low_stock_threshold, tags, status, category_id, brand_id, variants } = req.body;

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        await connection.query(
            'UPDATE products SET name = ?, description = ?, price = ?, sku = ?, inventory_quantity = ?, low_stock_threshold = ?, tags = ?, status = ?, category_id = ?, brand_id = ? WHERE id = ? AND tenant_id = ?',
            [name, description, price, sku, inventory_quantity, low_stock_threshold, tags, status, category_id || null, brand_id || null, id, tenantId]
        );

        // Update Variants: Simple Replace strategy for now
        if (variants && Array.isArray(variants)) {
            await connection.query('DELETE FROM product_variants WHERE product_id = ?', [id]);
            for (const v of variants) {
                await connection.query(
                    'INSERT INTO product_variants (product_id, variant_sku, price, stock_quantity, attributes_json) VALUES (?, ?, ?, ?, ?)',
                    [id, v.variant_sku || null, v.price || price, v.stock_quantity || 0, JSON.stringify(v.attributes_json || {})]
                );
            }
        }

        await connection.commit();
        res.json({ success: true, message: 'Product and variants updated' });
    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ success: false, message: 'Error updating product' });
    } finally {
        connection.release();
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

const fs = require('fs');
const csv = require('csv-parser');

exports.bulkUpload = async (req, res) => {
    const tenantId = req.tenantId;
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    const results = [];
    fs.createReadStream(req.file.path)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', async () => {
            const connection = await pool.getConnection();
            try {
                await connection.beginTransaction();

                // Check limits first
                const [planInfo] = await connection.query(
                    "SELECT p.product_limit FROM subscriptions s JOIN plans p ON s.plan_id = p.id WHERE s.tenant_id = ? AND s.status = 'active' LIMIT 1",
                    [tenantId]
                );

                if (planInfo.length > 0 && planInfo[0].product_limit !== -1) {
                    const [countInfo] = await connection.query('SELECT COUNT(*) as currentCount FROM products WHERE tenant_id = ?', [tenantId]);
                    const currentCount = countInfo[0].currentCount;
                    if (currentCount + results.length > planInfo[0].product_limit) {
                        await connection.rollback();
                        return res.status(403).json({ success: false, message: 'Bulk upload would exceed product limit.' });
                    }
                }

                for (const row of results) {
                    // Simple mapping: name, description, price, sku, inventory_quantity
                    await connection.query(
                        'INSERT INTO products (tenant_id, name, description, price, sku, inventory_quantity) VALUES (?, ?, ?, ?, ?, ?)',
                        [tenantId, row.name, row.description || '', row.price || 0, row.sku || '', row.inventory_quantity || 0]
                    );
                }

                await connection.commit();
                res.json({ success: true, message: `${results.length} products imported successfully` });
            } catch (error) {
                await connection.rollback();
                console.error("Bulk Upload Error", error);
                res.status(500).json({ success: false, message: 'Error during bulk import' });
            } finally {
                connection.release();
                fs.unlinkSync(req.file.path); // Cleanup temp file
            }
        });
};
