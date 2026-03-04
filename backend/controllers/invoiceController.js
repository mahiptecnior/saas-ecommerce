const pool = require('../config/db');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Ensure invoices directory exists
const invoiceDir = path.join(__dirname, '..', 'uploads', 'invoices');
if (!fs.existsSync(invoiceDir)) fs.mkdirSync(invoiceDir, { recursive: true });

// --- Invoice Generation ---
exports.generateInvoice = async (req, res) => {
    const { tenant_id, subscription_id, amount } = req.body;
    try {
        // Get active tax settings
        const [taxes] = await pool.query('SELECT * FROM tax_settings WHERE is_active = 1');
        const totalTaxRate = taxes.reduce((sum, t) => sum + parseFloat(t.rate), 0);
        const taxAmount = (amount * totalTaxRate / 100).toFixed(2);
        const total = (parseFloat(amount) + parseFloat(taxAmount)).toFixed(2);

        // Generate invoice number
        const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

        // Create DB record
        const [result] = await pool.query(
            'INSERT INTO invoices (tenant_id, subscription_id, invoice_number, amount, tax, total) VALUES (?, ?, ?, ?, ?, ?)',
            [tenant_id, subscription_id, invoiceNumber, amount, taxAmount, total]
        );

        // Generate PDF
        const pdfPath = path.join(invoiceDir, `${invoiceNumber}.pdf`);
        const pdfUrl = `/uploads/invoices/${invoiceNumber}.pdf`;

        const doc = new PDFDocument({ margin: 50 });
        doc.pipe(fs.createWriteStream(pdfPath));

        doc.fontSize(20).text('INVOICE', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Invoice #: ${invoiceNumber}`);
        doc.text(`Date: ${new Date().toLocaleDateString()}`);
        doc.text(`Tenant ID: ${tenant_id}`);
        doc.moveDown();
        doc.text('─'.repeat(50));
        doc.moveDown();
        doc.text(`Subtotal: $${amount}`);
        if (taxes.length > 0) {
            taxes.forEach(t => doc.text(`  ${t.name} (${t.rate}%): $${(amount * t.rate / 100).toFixed(2)}`));
        }
        doc.text(`Tax Total: $${taxAmount}`);
        doc.fontSize(14).text(`Total Due: $${total}`, { underline: true });
        doc.moveDown(2);
        doc.fontSize(10).text('Thank you for your business!', { align: 'center' });

        doc.end();

        // Update PDF URL
        await pool.query('UPDATE invoices SET pdf_url = ? WHERE id = ?', [pdfUrl, result.insertId]);

        res.status(201).json({ success: true, data: { id: result.insertId, invoiceNumber, amount, tax: taxAmount, total, pdf_url: pdfUrl } });
    } catch (error) {
        console.error('Invoice Generation Error:', error);
        res.status(500).json({ success: false, message: 'Error generating invoice' });
    }
};

exports.getInvoices = async (req, res) => {
    const { page = 1, limit = 20, tenant_id } = req.query;
    const offset = (page - 1) * limit;
    try {
        let where = '';
        const params = [];
        if (tenant_id) { where = 'WHERE i.tenant_id = ?'; params.push(tenant_id); }

        const [countRes] = await pool.query(`SELECT COUNT(*) as total FROM invoices i ${where}`, params);
        const [rows] = await pool.query(
            `SELECT i.*, t.name as tenant_name FROM invoices i LEFT JOIN tenants t ON i.tenant_id = t.id ${where} ORDER BY i.created_at DESC LIMIT ? OFFSET ?`,
            [...params, parseInt(limit), parseInt(offset)]
        );

        res.json({ success: true, data: rows, pagination: { total: countRes[0].total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(countRes[0].total / limit) } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching invoices' });
    }
};

// --- Tax Settings CRUD ---
exports.getTaxSettings = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM tax_settings ORDER BY created_at DESC');
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching tax settings' });
    }
};

exports.createTaxSetting = async (req, res) => {
    const { name, rate, country } = req.body;
    try {
        const [result] = await pool.query('INSERT INTO tax_settings (name, rate, country) VALUES (?, ?, ?)', [name, rate, country]);
        res.status(201).json({ success: true, data: { id: result.insertId, name, rate } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error creating tax setting' });
    }
};

exports.updateTaxSetting = async (req, res) => {
    const { id } = req.params;
    const { name, rate, country, is_active } = req.body;
    try {
        await pool.query('UPDATE tax_settings SET name = ?, rate = ?, country = ?, is_active = ? WHERE id = ?', [name, rate, country, is_active, id]);
        res.json({ success: true, message: 'Tax setting updated' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error updating tax setting' });
    }
};

exports.deleteTaxSetting = async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM tax_settings WHERE id = ?', [id]);
        res.json({ success: true, message: 'Tax setting deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error deleting tax setting' });
    }
};

// --- Refund Management ---
exports.processRefund = async (req, res) => {
    const { orderId, refundAmount } = req.body;
    try {
        const [order] = await pool.query('SELECT * FROM orders WHERE id = ?', [orderId]);
        if (order.length === 0) return res.status(404).json({ success: false, message: 'Order not found' });

        if (refundAmount > order[0].total_amount) {
            return res.status(400).json({ success: false, message: 'Refund amount exceeds order total' });
        }

        await pool.query(
            'UPDATE orders SET refund_status = "refunded", refund_amount = ? WHERE id = ?',
            [refundAmount, orderId]
        );

        res.json({ success: true, message: `Refund of $${refundAmount} processed for order #${orderId}` });
    } catch (error) {
        console.error('Refund Error:', error);
        res.status(500).json({ success: false, message: 'Error processing refund' });
    }
};
