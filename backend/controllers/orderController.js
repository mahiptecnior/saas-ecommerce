const pool = require('../config/db');
const mailService = require('../utils/mailService');

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
