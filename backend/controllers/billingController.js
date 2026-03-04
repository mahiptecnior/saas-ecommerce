const pool = require('../config/db');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_mock_key');
const logger = require('../utils/logger');

exports.createCheckoutSession = async (req, res) => {
    const tenantId = req.tenantId;
    const { planId, billingCycle } = req.body; // billingCycle: 'monthly' or 'yearly'

    if (!tenantId || !planId || !billingCycle) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    try {
        // 1. Fetch Plan Details
        const [plans] = await pool.query('SELECT * FROM plans WHERE id = ?', [planId]);
        if (plans.length === 0) return res.status(404).json({ success: false, message: 'Plan not found' });
        const plan = plans[0];

        // Ensure price is greater than 0
        const price = billingCycle === 'yearly' ? plan.price_yearly : plan.price_monthly;
        if (price <= 0) {
            return res.status(400).json({ success: false, message: 'Invalid plan price for checkout' });
        }

        // 2. Create Stripe Checkout Session
        // Note: In production, you would map `plan.id` to an actual Stripe Price ID stored in your DB.

        const stripeKey = process.env.STRIPE_SECRET_KEY || 'sk_test_mock_key';
        if (stripeKey === 'sk_test_mock_key') {
            // Mock Checkout URL for local testing without real keys
            return res.json({
                success: true,
                url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/tenant/billing?payment=success&session_id=mock_cs_test_123`
            });
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            customer_email: req.user ? req.user.email : 'tenant@example.com', // Safe fallback
            client_reference_id: tenantId.toString(), // To identify tenant in webhook
            metadata: {
                tenantId: tenantId.toString(),
                planId: planId.toString(),
                billingCycle: billingCycle
            },
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: `Upgrade to ${plan.name} (${billingCycle})`,
                        },
                        unit_amount: Math.round(price * 100), // Stripe expects cents
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment', // Change to 'subscription' if using Stripe Billing features
            success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/tenant/billing?payment=success&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/tenant/billing?payment=cancelled`,
        });

        res.json({ success: true, url: session.url });
    } catch (error) {
        console.error('Stripe Checkout Error:', error.message || error);
        res.status(500).json({ success: false, message: 'Could not create checkout session' });
    }
};

exports.handleWebhook = async (req, res) => {
    const payload = req.body;
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_mock_secret';

    let event;

    try {
        event = stripe.webhooks.constructEvent(payload, sig, endpointSecret);
    } catch (err) {
        console.error(`Webhook signature verification failed: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the checkout.session.completed event
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const tenantId = session.metadata.tenantId;
        const planId = session.metadata.planId;
        const billingCycle = session.metadata.billingCycle;

        try {
            const connection = await pool.getConnection();
            await connection.beginTransaction();

            // 1. Deactivate old subscriptions
            await connection.query('UPDATE subscriptions SET status = "expired" WHERE tenant_id = ? AND status = "active"', [tenantId]);

            // 2. Insert new active subscription
            // Calculate end date based on cycle
            const startDate = new Date();
            const endDate = new Date(startDate);
            if (billingCycle === 'yearly') {
                endDate.setFullYear(endDate.getFullYear() + 1);
            } else {
                endDate.setMonth(endDate.getMonth() + 1);
            }

            // MySQL timestamp formatting YYYY-MM-DD
            const sDateStr = startDate.toISOString().split('T')[0];
            const eDateStr = endDate.toISOString().split('T')[0];

            await connection.query(
                `INSERT INTO subscriptions (tenant_id, plan_id, billing_cycle, start_date, end_date, status) 
                 VALUES (?, ?, ?, ?, ?, 'active')`,
                [tenantId, planId, billingCycle, sDateStr, eDateStr]
            );

            // 3. Clear existing dynamic modules to prepare for inherited modules
            await connection.query('DELETE FROM tenant_modules WHERE tenant_id = ?', [tenantId]);

            // 4. Inherit new features from the newly purchased plan
            const [planModules] = await connection.query('SELECT module_id FROM plan_modules WHERE plan_id = ?', [planId]);
            if (planModules.length > 0) {
                const values = planModules.map(pm => [tenantId, pm.module_id]);
                await connection.query('INSERT INTO tenant_modules (tenant_id, module_id) VALUES ?', [values]);
            }

            await connection.commit();
            connection.release();

            console.log(`Successfully upgraded Tenant ${tenantId} to Plan ${planId}`);
        } catch (dbError) {
            console.error('Error processing successful payment webhook DB update:', dbError);
        }
    }

    // Handle failed payments
    if (event.type === 'payment_intent.payment_failed') {
        const intent = event.data.object;
        const failedTenantId = intent.metadata?.tenantId;
        if (failedTenantId) {
            try {
                await pool.query(
                    'UPDATE subscriptions SET payment_status = "failed" WHERE tenant_id = ? AND status = "active"',
                    [failedTenantId]
                );
                await logger.logAction(failedTenantId, null, 'PAYMENT_FAILED', {
                    amount: intent.amount,
                    error: intent.last_payment_error?.message || 'Unknown'
                }, '');
                console.log(`[WEBHOOK] Payment failed for tenant ${failedTenantId}`);
            } catch (err) {
                console.error('Failed payment handling error:', err);
            }
        }
    }

    res.status(200).end();
};
