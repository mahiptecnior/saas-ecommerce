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
    const { customer_id, total_amount, items } = req.body;

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

        const [orderResult] = await connection.query(
            'INSERT INTO orders (tenant_id, customer_id, total_amount, status) VALUES (?, ?, ?, ?)',
            [tenantId, customer_id, total_amount, 'pending']
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
