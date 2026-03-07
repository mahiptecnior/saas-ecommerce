const pool = require('../config/db');

exports.getWarehouses = async (req, res) => {
    const tenantId = req.tenantId;
    try {
        const [rows] = await pool.query('SELECT * FROM warehouses WHERE tenant_id = ? ORDER BY is_default DESC, name ASC', [tenantId]);
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Error fetching warehouses:', error);
        res.status(500).json({ success: false, message: 'Error fetching warehouses' });
    }
};

exports.createWarehouse = async (req, res) => {
    const tenantId = req.tenantId;
    const { name, location, is_default } = req.body;

    if (!name) return res.status(400).json({ success: false, message: 'Warehouse name is required' });

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        if (is_default) {
            // Remove default status from others
            await connection.query('UPDATE warehouses SET is_default = FALSE WHERE tenant_id = ?', [tenantId]);
        }

        const [result] = await connection.query(
            'INSERT INTO warehouses (tenant_id, name, location, is_default) VALUES (?, ?, ?, ?)',
            [tenantId, name, location || null, is_default || false]
        );

        await connection.commit();
        res.status(201).json({ success: true, data: { id: result.insertId, name } });
    } catch (error) {
        await connection.rollback();
        console.error('Error creating warehouse:', error);
        res.status(500).json({ success: false, message: 'Error creating warehouse' });
    } finally {
        connection.release();
    }
};

exports.getInventory = async (req, res) => {
    const tenantId = req.tenantId;
    try {
        // Fetch inventory joined with products and variants
        const [rows] = await pool.query(`
            SELECT 
                i.id, i.product_id, i.variant_id, i.warehouse_id, i.quantity, i.updated_at,
                w.name as warehouse_name,
                p.name as product_name, p.sku as product_sku,
                v.variant_sku
            FROM inventory_levels i
            JOIN warehouses w ON i.warehouse_id = w.id
            JOIN products p ON i.product_id = p.id
            LEFT JOIN product_variants v ON i.variant_id = v.id
            WHERE i.tenant_id = ?
            ORDER BY w.name ASC, p.name ASC
        `, [tenantId]);
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Error fetching inventory:', error);
        res.status(500).json({ success: false, message: 'Error fetching inventory' });
    }
};

exports.adjustInventory = async (req, res) => {
    const tenantId = req.tenantId;
    const { product_id, variant_id, warehouse_id, type, quantity, reference } = req.body;

    if (!product_id || !warehouse_id || !type || quantity === undefined) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const adjQty = parseInt(quantity, 10);
    if (isNaN(adjQty) || adjQty <= 0) {
        return res.status(400).json({ success: false, message: 'Quantity must be > 0' });
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // Check current level
        const [current] = await connection.query(
            'SELECT quantity FROM inventory_levels WHERE tenant_id = ? AND product_id = ? AND (variant_id = ? OR (? IS NULL AND variant_id IS NULL)) AND warehouse_id = ? FOR UPDATE',
            [tenantId, product_id, variant_id || null, variant_id || null, warehouse_id]
        );

        let newTotal = 0;
        if (current.length === 0) {
            if (type === 'out') {
                await connection.rollback();
                return res.status(400).json({ success: false, message: 'Insufficient stock to remove' });
            }
            newTotal = type === 'in' || type === 'adjustment' ? adjQty : 0;
            await connection.query(
                'INSERT INTO inventory_levels (tenant_id, product_id, variant_id, warehouse_id, quantity) VALUES (?, ?, ?, ?, ?)',
                [tenantId, product_id, variant_id || null, warehouse_id, newTotal]
            );
        } else {
            const currentQty = current[0].quantity;
            if (type === 'in') newTotal = currentQty + adjQty;
            else if (type === 'out') {
                if (currentQty < adjQty) {
                    await connection.rollback();
                    return res.status(400).json({ success: false, message: 'Insufficient stock' });
                }
                newTotal = currentQty - adjQty;
            } else if (type === 'adjustment') {
                newTotal = adjQty; // Direct set
            }

            await connection.query(
                'UPDATE inventory_levels SET quantity = ? WHERE tenant_id = ? AND product_id = ? AND (variant_id = ? OR (? IS NULL AND variant_id IS NULL)) AND warehouse_id = ?',
                [newTotal, tenantId, product_id, variant_id || null, variant_id || null, warehouse_id]
            );
        }

        // Log movement. For 'adjustment' mode, calculate diff for log.
        let moveType = type;
        let diffQty = adjQty;
        if (type === 'adjustment' && current.length > 0) {
            const cur = current[0].quantity;
            diffQty = Math.abs(adjQty - cur);
            moveType = adjQty >= cur ? 'in' : 'out';
        }

        if (diffQty > 0) {
            await connection.query(
                'INSERT INTO stock_movements (tenant_id, product_id, variant_id, warehouse_id, type, quantity, reference) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [tenantId, product_id, variant_id || null, warehouse_id, moveType, diffQty, reference || 'Manual Adjustment']
            );
        }

        // Also update master product/variant stock quantity (for storefront backwards compatibility)
        // If variant: update product_variants.stock_quantity. If plain product: update products.inventory_quantity
        // Sum across all warehouses for this tenant/product[/variant]

        if (variant_id) {
            const [sumRes] = await connection.query('SELECT SUM(quantity) as total FROM inventory_levels WHERE tenant_id = ? AND product_id = ? AND variant_id = ?', [tenantId, product_id, variant_id]);
            await connection.query('UPDATE product_variants SET stock_quantity = ? WHERE id = ? AND product_id = ?', [sumRes[0].total || 0, variant_id, product_id]);
        } else {
            const [sumRes] = await connection.query('SELECT SUM(quantity) as total FROM inventory_levels WHERE tenant_id = ? AND product_id = ? AND variant_id IS NULL', [tenantId, product_id]);
            await connection.query('UPDATE products SET inventory_quantity = ? WHERE id = ? AND tenant_id = ?', [sumRes[0].total || 0, product_id, tenantId]);
        }

        await connection.commit();
        res.json({ success: true, message: 'Inventory adjusted successfully', newQuantity: newTotal });
    } catch (error) {
        await connection.rollback();
        console.error('Error adjusting inventory:', error);
        res.status(500).json({ success: false, message: 'Error adjusting inventory' });
    } finally {
        connection.release();
    }
};

// --- Batches ---
exports.getBatches = async (req, res) => {
    const tenantId = req.tenantId;
    try {
        const [rows] = await pool.query(`
            SELECT b.*, w.name as warehouse_name, p.name as product_name, p.sku as product_sku, v.variant_sku
            FROM inventory_batches b
            JOIN warehouses w ON b.warehouse_id = w.id
            JOIN products p ON b.product_id = p.id
            LEFT JOIN product_variants v ON b.variant_id = v.id
            WHERE b.tenant_id = ?
            ORDER BY b.expiry_date ASC, b.created_at DESC
        `, [tenantId]);
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Error fetching batches:', error);
        res.status(500).json({ success: false, message: 'Error fetching batches' });
    }
};

exports.createBatch = async (req, res) => {
    const tenantId = req.tenantId;
    const { product_id, variant_id, warehouse_id, batch_number, expiry_date, quantity } = req.body;

    if (!product_id || !warehouse_id || !batch_number) {
        return res.status(400).json({ success: false, message: 'Product, Warehouse, and Batch Number are required' });
    }

    try {
        await pool.query(
            'INSERT INTO inventory_batches (tenant_id, product_id, variant_id, warehouse_id, batch_number, expiry_date, quantity) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [tenantId, product_id, variant_id || null, warehouse_id, batch_number, expiry_date || null, quantity || 0]
        );
        res.status(201).json({ success: true, message: 'Batch created successfully' });
    } catch (error) {
        console.error('Error creating batch:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ success: false, message: 'This batch number already exists for this product in this warehouse.' });
        }
        res.status(500).json({ success: false, message: 'Error creating batch' });
    }
};
