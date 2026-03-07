const pool = require('../config/db');

// --- Vendors ---
exports.getVendors = async (req, res) => {
    const tenantId = req.tenantId;
    try {
        const [rows] = await pool.query('SELECT * FROM vendors WHERE tenant_id = ? ORDER BY name ASC', [tenantId]);
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Error fetching vendors:', error);
        res.status(500).json({ success: false, message: 'Error fetching vendors' });
    }
};

exports.createVendor = async (req, res) => {
    const tenantId = req.tenantId;
    const { name, contact_name, email, phone, address } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Vendor name is required' });

    try {
        await pool.query(
            'INSERT INTO vendors (tenant_id, name, contact_name, email, phone, address) VALUES (?, ?, ?, ?, ?, ?)',
            [tenantId, name, contact_name || null, email || null, phone || null, address || null]
        );
        res.status(201).json({ success: true, message: 'Vendor created successfully' });
    } catch (error) {
        console.error('Error creating vendor:', error);
        res.status(500).json({ success: false, message: 'Error creating vendor' });
    }
};

exports.updateVendor = async (req, res) => {
    const tenantId = req.tenantId;
    const { id } = req.params;
    const { name, contact_name, email, phone, address } = req.body;

    try {
        await pool.query(
            'UPDATE vendors SET name = ?, contact_name = ?, email = ?, phone = ?, address = ? WHERE id = ? AND tenant_id = ?',
            [name, contact_name || null, email || null, phone || null, address || null, id, tenantId]
        );
        res.json({ success: true, message: 'Vendor updated' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error updating vendor' });
    }
};

exports.deleteVendor = async (req, res) => {
    const tenantId = req.tenantId;
    const { id } = req.params;

    try {
        await pool.query('DELETE FROM vendors WHERE id = ? AND tenant_id = ?', [id, tenantId]);
        res.json({ success: true, message: 'Vendor deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error deleting vendor' });
    }
};

// --- Purchase Orders ---
exports.getPurchaseOrders = async (req, res) => {
    const tenantId = req.tenantId;
    try {
        const [rows] = await pool.query(`
            SELECT p.*, v.name as vendor_name 
            FROM purchase_orders p
            LEFT JOIN vendors v ON p.vendor_id = v.id
            WHERE p.tenant_id = ? ORDER BY p.date DESC
        `, [tenantId]);
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Error fetching POs:', error);
        res.status(500).json({ success: false, message: 'Error fetching purchase orders' });
    }
};

exports.getPurchaseOrderDetails = async (req, res) => {
    const tenantId = req.tenantId;
    const { id } = req.params;
    try {
        const [po] = await pool.query('SELECT p.*, v.name as vendor_name FROM purchase_orders p LEFT JOIN vendors v ON p.vendor_id = v.id WHERE p.id = ? AND p.tenant_id = ?', [id, tenantId]);
        if (po.length === 0) return res.status(404).json({ success: false, message: 'PO not found' });

        const [items] = await pool.query(`
            SELECT i.*, p.name as product_name, p.sku as product_sku, v.variant_sku
            FROM purchase_order_items i
            JOIN products p ON i.product_id = p.id
            LEFT JOIN product_variants v ON i.variant_id = v.id
            WHERE i.po_id = ?
        `, [id]);

        res.json({ success: true, data: { ...po[0], items } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching PO details' });
    }
};

exports.createPurchaseOrder = async (req, res) => {
    const tenantId = req.tenantId;
    const { vendor_id, po_number, items } = req.body;

    if (!vendor_id || !po_number || !items || items.length === 0) {
        return res.status(400).json({ success: false, message: 'Missing required PO data' });
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        let totalAmount = 0;
        items.forEach(i => totalAmount += (parseFloat(i.unit_price || 0) * parseInt(i.quantity || 0)));

        const [poResult] = await connection.query(
            'INSERT INTO purchase_orders (tenant_id, vendor_id, po_number, status, total_amount) VALUES (?, ?, ?, ?, ?)',
            [tenantId, vendor_id, po_number, 'draft', totalAmount]
        );
        const poId = poResult.insertId;

        for (const item of items) {
            await connection.query(
                'INSERT INTO purchase_order_items (po_id, product_id, variant_id, quantity, unit_price) VALUES (?, ?, ?, ?, ?)',
                [poId, item.product_id, item.variant_id || null, item.quantity, item.unit_price || 0]
            );
        }

        await connection.commit();
        res.status(201).json({ success: true, message: 'Purchase Order created', data: { id: poId } });
    } catch (error) {
        await connection.rollback();
        console.error('Error creating PO:', error);
        res.status(500).json({ success: false, message: 'Error creating purchase order' });
    } finally {
        connection.release();
    }
};

exports.receivePurchaseOrder = async (req, res) => {
    const tenantId = req.tenantId;
    const { id } = req.params;
    const { warehouse_id } = req.body; // Target warehouse to receive stock into

    if (!warehouse_id) return res.status(400).json({ success: false, message: 'Target warehouse is required' });

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Mark PO as received
        const [poRes] = await connection.query('UPDATE purchase_orders SET status = ? WHERE id = ? AND tenant_id = ? AND status != ?', ['received', id, tenantId, 'received']);
        if (poRes.affectedRows === 0) {
            await connection.rollback();
            return res.status(400).json({ success: false, message: 'PO not found or already received' });
        }

        // 2. Fetch PO Items
        const [items] = await connection.query('SELECT * FROM purchase_order_items WHERE po_id = ?', [id]);

        // 3. Loop items, update received count, update inventory levels, insert movements
        const [po] = await connection.query('SELECT po_number FROM purchase_orders WHERE id = ?', [id]);
        const poNumber = po[0]?.po_number || `PO-${id}`;

        for (const item of items) {
            const qty = item.quantity;

            // Update PO item received count
            await connection.query('UPDATE purchase_order_items SET received_quantity = ? WHERE id = ?', [qty, item.id]);

            // Upsert inventory_levels
            const [curLevel] = await connection.query(
                'SELECT quantity FROM inventory_levels WHERE tenant_id = ? AND product_id = ? AND (variant_id = ? OR (? IS NULL AND variant_id IS NULL)) AND warehouse_id = ? FOR UPDATE',
                [tenantId, item.product_id, item.variant_id || null, item.variant_id || null, warehouse_id]
            );

            if (curLevel.length === 0) {
                await connection.query(
                    'INSERT INTO inventory_levels (tenant_id, product_id, variant_id, warehouse_id, quantity) VALUES (?, ?, ?, ?, ?)',
                    [tenantId, item.product_id, item.variant_id || null, warehouse_id, qty]
                );
            } else {
                await connection.query(
                    'UPDATE inventory_levels SET quantity = quantity + ? WHERE tenant_id = ? AND product_id = ? AND (variant_id = ? OR (? IS NULL AND variant_id IS NULL)) AND warehouse_id = ?',
                    [qty, tenantId, item.product_id, item.variant_id || null, item.variant_id || null, warehouse_id]
                );
            }

            // Insert stock_movements
            await connection.query(
                'INSERT INTO stock_movements (tenant_id, product_id, variant_id, warehouse_id, type, quantity, reference) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [tenantId, item.product_id, item.variant_id || null, warehouse_id, 'in', qty, `Received ${poNumber}`]
            );

            // Backwards compatibility legacy update
            if (item.variant_id) {
                const [sumRes] = await connection.query('SELECT SUM(quantity) as total FROM inventory_levels WHERE tenant_id = ? AND product_id = ? AND variant_id = ?', [tenantId, item.product_id, item.variant_id]);
                await connection.query('UPDATE product_variants SET stock_quantity = ? WHERE id = ? AND product_id = ?', [sumRes[0].total || 0, item.variant_id, item.product_id]);
            } else {
                const [sumRes] = await connection.query('SELECT SUM(quantity) as total FROM inventory_levels WHERE tenant_id = ? AND product_id = ? AND variant_id IS NULL', [tenantId, item.product_id]);
                await connection.query('UPDATE products SET inventory_quantity = ? WHERE id = ? AND tenant_id = ?', [sumRes[0].total || 0, item.product_id, tenantId]);
            }
        }

        await connection.commit();
        res.json({ success: true, message: 'Purchase Order marked as received and inventory updated.' });
    } catch (error) {
        await connection.rollback();
        console.error('Error receiving PO:', error);
        res.status(500).json({ success: false, message: 'Error receiving purchase order' });
    } finally {
        connection.release();
    }
};

// --- Invoices & Vendor Ledger ---
exports.getVendorLedger = async (req, res) => {
    const tenantId = req.tenantId;
    const { vendor_id } = req.params;
    try {
        const [rows] = await pool.query('SELECT * FROM vendor_ledger WHERE tenant_id = ? AND vendor_id = ? ORDER BY date DESC', [tenantId, vendor_id]);

        // Calculate running balance (simple sum: credit - debit)
        // cr (we paid them) reduces balance owed. dr (they invoiced us) increases balance owed.
        const [balRes] = await pool.query(`
            SELECT 
                SUM(CASE WHEN type='dr' THEN amount ELSE 0 END) as total_dr,
                SUM(CASE WHEN type='cr' THEN amount ELSE 0 END) as total_cr
            FROM vendor_ledger WHERE tenant_id = ? AND vendor_id = ?
        `, [tenantId, vendor_id]);

        const balance = (balRes[0].total_dr || 0) - (balRes[0].total_cr || 0);

        res.json({ success: true, data: { ledger: rows, balance } });
    } catch (error) {
        console.error('Error fetching ledger:', error);
        res.status(500).json({ success: false, message: 'Error fetching vendor ledger' });
    }
};

exports.getPurchaseInvoices = async (req, res) => {
    const tenantId = req.tenantId;
    try {
        const [rows] = await pool.query(`
            SELECT i.*, v.name as vendor_name, p.po_number 
            FROM purchase_invoices i
            JOIN vendors v ON i.vendor_id = v.id
            JOIN purchase_orders p ON i.po_id = p.id
            WHERE i.tenant_id = ? ORDER BY i.date DESC
        `, [tenantId]);
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Error fetching purchase invoices:', error);
        res.status(500).json({ success: false, message: 'Error fetching invoices' });
    }
};

exports.createPurchaseInvoice = async (req, res) => {
    const tenantId = req.tenantId;
    const { po_id, vendor_id, invoice_number, total, due_date } = req.body;

    if (!po_id || !vendor_id || !invoice_number || !total) {
        return res.status(400).json({ success: false, message: 'Missing required invoice fields' });
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Create Invoice
        const [invRes] = await connection.query(
            'INSERT INTO purchase_invoices (tenant_id, po_id, vendor_id, invoice_number, total, due_date) VALUES (?, ?, ?, ?, ?, ?)',
            [tenantId, po_id, vendor_id, invoice_number, total, due_date || null]
        );

        // 2. Add Debit (dr) to Vendor Ledger (We owe them this money)
        await connection.query(
            'INSERT INTO vendor_ledger (tenant_id, vendor_id, type, amount, reference) VALUES (?, ?, ?, ?, ?)',
            [tenantId, vendor_id, 'dr', total, `Invoice ${invoice_number}`]
        );

        await connection.commit();
        res.status(201).json({ success: true, message: 'Purchase Invoice created and ledger updated.' });
    } catch (error) {
        await connection.rollback();
        console.error('Error creating invoice:', error);
        res.status(500).json({ success: false, message: 'Error creating purchase invoice' });
    } finally {
        connection.release();
    }
};

exports.recordVendorPayment = async (req, res) => {
    const tenantId = req.tenantId;
    const { vendor_id, amount, reference } = req.body;

    if (!vendor_id || !amount) {
        return res.status(400).json({ success: false, message: 'Vendor and amount are required' });
    }

    try {
        // Add Credit (cr) to Vendor Ledger (We paid them, reducing what we owe)
        await pool.query(
            'INSERT INTO vendor_ledger (tenant_id, vendor_id, type, amount, reference) VALUES (?, ?, ?, ?, ?)',
            [tenantId, vendor_id, 'cr', amount, reference || 'Payment']
        );
        res.status(201).json({ success: true, message: 'Payment recorded to ledger.' });
    } catch (error) {
        console.error('Error recording payment:', error);
        res.status(500).json({ success: false, message: 'Error recording payment' });
    }
};
