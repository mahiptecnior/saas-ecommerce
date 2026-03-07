const pool = require('../config/db');
const mailService = require('../utils/mailService');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Ensure invoices directory exists
const invoiceDir = path.join(__dirname, '..', 'uploads', 'order_invoices');
if (!fs.existsSync(invoiceDir)) fs.mkdirSync(invoiceDir, { recursive: true });

exports.getOrders = async (req, res) => {
    const tenantId = req.tenantId;
    try {
        const [rows] = await pool.query('SELECT * FROM orders WHERE tenant_id = ? ORDER BY created_at DESC', [tenantId]);
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching orders' });
    }
};

exports.createOrder = async (req, res) => {
    const tenantId = req.tenantId;
    const { customer_id, total_amount, tax_amount, items, source } = req.body;

    // Enforce order limits based on active subscription
    try {
        const [planInfo] = await pool.query(
            `SELECT p.order_limit 
             FROM subscriptions s
             JOIN plans p ON s.plan_id = p.id
             WHERE s.tenant_id = ? AND s.status = 'active'
             LIMIT 1`,
            [tenantId]
        );

        if (planInfo.length > 0) {
            const limit = planInfo[0].order_limit;
            if (limit !== -1) {
                // Check current order count
                const [countInfo] = await pool.query('SELECT COUNT(*) as currentCount FROM orders WHERE tenant_id = ?', [tenantId]);
                const currentCount = countInfo[0].currentCount;

                if (currentCount >= limit) {
                    return res.status(403).json({
                        success: false,
                        errorCode: 'LIMIT_REACHED',
                        message: `Order limit reached. Your plan allows a maximum of ${limit} orders.`
                    });
                }
            }
        }
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Error checking order limits' });
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const orderSource = source || 'web'; // web, pos, manual
        const taxAmt = tax_amount || 0.00;
        const [orderResult] = await connection.query(
            'INSERT INTO orders (tenant_id, customer_id, total_amount, tax_amount, status, source) VALUES (?, ?, ?, ?, ?, ?)',
            [tenantId, customer_id, total_amount, taxAmt, 'pending', orderSource]
        );
        const orderId = orderResult.insertId;

        for (const item of items) {
            await connection.query(
                'INSERT INTO order_items (tenant_id, order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?, ?)',
                [tenantId, orderId, item.product_id, item.quantity, item.unit_price]
            );
        }

        await connection.commit();

        // Send Notifications (In a real app, you'd fetch customer/tenant emails here)
        // For demonstration, we'll log it
        await mailService.sendEmail(
            'tenant@example.com', // Would be owner email
            'New Order Received',
            `You have received a new order #${orderId} for $${total_amount}.`,
            `<h1>New Order!</h1><p>Order ID: #${orderId}</p><p>Total: $${total_amount}</p>`
        );

        res.status(201).json({ success: true, data: { orderId } });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ success: false, message: 'Error creating order' });
    } finally {
        connection.release();
    }
};

exports.getOrder = async (req, res) => {
    const tenantId = req.tenantId;
    const { id } = req.params;
    try {
        const [orders] = await pool.query('SELECT * FROM orders WHERE id = ? AND tenant_id = ?', [id, tenantId]);
        if (orders.length === 0) return res.status(404).json({ success: false, message: 'Order not found' });

        const [items] = await pool.query('SELECT * FROM order_items WHERE order_id = ? AND tenant_id = ?', [id, tenantId]);
        res.json({ success: true, data: { ...orders[0], items } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching order' });
    }
};

exports.updateOrderStatus = async (req, res) => {
    const tenantId = req.tenantId;
    const { id } = req.params;
    const { status } = req.body;
    try {
        await pool.query('UPDATE orders SET status = ? WHERE id = ? AND tenant_id = ?', [status, id, tenantId]);
        res.json({ success: true, message: 'Order status updated' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error updating status' });
    }
};

exports.generateOrderInvoice = async (req, res) => {
    const tenantId = req.tenantId;
    const { id } = req.params;

    try {
        // 1. Fetch Order & Items
        const [orders] = await pool.query('SELECT * FROM orders WHERE id = ? AND tenant_id = ?', [id, tenantId]);
        if (orders.length === 0) return res.status(404).json({ success: false, message: 'Order not found' });
        const order = orders[0];

        const [items] = await pool.query(`
            SELECT oi.*, p.name as product_name 
            FROM order_items oi
            LEFT JOIN products p ON oi.product_id = p.id
            WHERE oi.order_id = ?
        `, [id]);

        // 2. Fetch Tenant Settings (GST, Bank, logo, etc.)
        const [settingsRows] = await pool.query('SELECT * FROM settings WHERE tenant_id = ?', [tenantId]);
        const settings = settingsRows[0] || {};
        const bankDetails = settings.bank_details ? (typeof settings.bank_details === 'string' ? JSON.parse(settings.bank_details) : settings.bank_details) : {};

        // 3. Generate PDF
        const invoiceNumber = `ORD-INV-${order.id}-${Date.now().toString(36).toUpperCase()}`;
        const pdfPath = path.join(invoiceDir, `${invoiceNumber}.pdf`);

        const doc = new PDFDocument({ margin: 50 });
        const stream = fs.createWriteStream(pdfPath);
        doc.pipe(stream);

        // Header
        if (settings.logo_url) {
            // In a real app, you'd download or use local path. For now, text logo
            doc.fontSize(20).text(settings.store_name || 'Store Invoice', { align: 'right' });
        } else {
            doc.fontSize(20).text(settings.store_name || 'Store Invoice', { align: 'right' });
        }

        doc.fontSize(10).text(`Date: ${new Date().toLocaleDateString()}`, { align: 'right' });
        doc.text(`Invoice #: ${invoiceNumber}`, { align: 'right' });
        doc.moveDown();

        // Business Info
        doc.fontSize(12).text('From:', { underline: true });
        doc.fontSize(10).text(settings.business_name || settings.store_name);
        doc.text(settings.business_address || '');
        if (settings.gst_number) doc.text(`GST: ${settings.gst_number}`);
        doc.moveDown();

        // Order Summary Table
        doc.fontSize(12).text('Order Summary:', { underline: true });
        doc.moveDown(0.5);

        items.forEach((item, index) => {
            doc.fontSize(10).text(`${index + 1}. ${item.product_name || `Product ID: ${item.product_id}`} | Qty: ${item.quantity} | Total: $${(item.quantity * item.unit_price).toFixed(2)}`);
        });

        doc.moveDown();
        if (parseFloat(order.tax_amount) > 0) {
            doc.fontSize(10).text(`Tax Amount: $${parseFloat(order.tax_amount).toFixed(2)}`, { align: 'right' });
            doc.moveDown(0.5);
        }
        doc.fontSize(12).text(`Total Amount: $${parseFloat(order.total_amount).toFixed(2)}`, { align: 'right', bold: true });
        doc.moveDown();

        // Bank Details
        if (bankDetails.bank_name) {
            doc.fontSize(12).text('Payment Instructions (Bank Transfer):', { underline: true });
            doc.fontSize(10).text(`Bank: ${bankDetails.bank_name}`);
            doc.text(`Acc Name: ${bankDetails.account_name}`);
            doc.text(`Acc No: ${bankDetails.account_number}`);
            doc.text(`IFSC/Routing: ${bankDetails.routing_number}`);
        }

        doc.moveDown(2);
        doc.fontSize(10).text('Generated by Nazmart SaaS', { align: 'center', color: 'grey' });

        doc.end();

        stream.on('finish', () => {
            res.download(pdfPath, `Invoice-${invoiceNumber}.pdf`);
        });

    } catch (error) {
        console.error('Invoice generation error:', error);
        res.status(500).json({ success: false, message: 'Failed to generate invoice' });
    }
};

exports.getBillingDocuments = async (req, res) => {
    const tenantId = req.tenantId;
    try {
        const [rows] = await pool.query(`
            SELECT b.*, c.name as customer_name, o.id as order_ref 
            FROM billing_documents b
            LEFT JOIN customers c ON b.customer_id = c.id
            LEFT JOIN orders o ON b.order_id = o.id
            WHERE b.tenant_id = ?
            ORDER BY b.created_at DESC
        `, [tenantId]);
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching billing documents' });
    }
};

exports.createBillingDocument = async (req, res) => {
    const tenantId = req.tenantId;
    const { order_id, customer_id, document_type, document_number, total_amount, due_date, notes } = req.body;

    try {
        const [result] = await pool.query(`
            INSERT INTO billing_documents 
            (tenant_id, order_id, customer_id, document_type, document_number, total_amount, due_date, notes) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [tenantId, order_id || null, customer_id, document_type, document_number, total_amount, due_date || null, notes || null]);

        res.status(201).json({ success: true, data: { id: result.insertId, document_number } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error creating billing document: ' + error.message });
    }
};

// --- RECURRING INVOICES ---

exports.getRecurringInvoices = async (req, res) => {
    const tenantId = req.tenantId;
    try {
        const [rows] = await pool.query(`
            SELECT r.*, c.name as customer_name, c.email as customer_email
            FROM recurring_invoices r
            LEFT JOIN customers c ON r.customer_id = c.id
            WHERE r.tenant_id = ?
            ORDER BY r.next_invoice_date ASC
        `, [tenantId]);
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching recurring invoices' });
    }
};

exports.createRecurringInvoice = async (req, res) => {
    const tenantId = req.tenantId;
    const { customer_id, name, frequency, amount, next_invoice_date } = req.body;

    try {
        const [result] = await pool.query(`
            INSERT INTO recurring_invoices 
            (tenant_id, customer_id, name, frequency, amount, next_invoice_date, status) 
            VALUES (?, ?, ?, ?, ?, ?, 'active')
        `, [tenantId, customer_id, name, frequency, amount, next_invoice_date]);

        res.status(201).json({ success: true, message: 'Recurring invoice profile created', id: result.insertId });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error creating recurring invoice' });
    }
};

exports.updateRecurringInvoiceStatus = async (req, res) => {
    const tenantId = req.tenantId;
    const { id } = req.params;
    const { status } = req.body; // active, paused, cancelled
    try {
        await pool.query('UPDATE recurring_invoices SET status = ? WHERE id = ? AND tenant_id = ?', [status, id, tenantId]);
        res.json({ success: true, message: 'Status updated' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error updating recurring invoice status' });
    }
};
