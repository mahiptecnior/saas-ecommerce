const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const tenantContext = require('./middleware/tenantContext');
const billingController = require('./controllers/billingController');
const { startCronJobs } = require('./utils/cronJobs');

dotenv.config();

const app = express();

app.use(cors());

// --- STRIPE WEBHOOK MUST BE RAW ---
app.post('/api/v1/billing/webhook', express.raw({ type: 'application/json' }), billingController.handleWebhook);

// Middleware (Parsed JSON for the rest of the app)
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(tenantContext);

// Routes Placeholder
app.get('/', (req, res) => {
    res.json({ message: 'SaaS eCommerce API is running' });
});

// Public Routes (No Auth Required)
app.use('/api/v1/public', require('./routes/publicRoutes'));

// Authentication Routes
app.use('/api/v1/auth', require('./routes/authRoutes'));

// Super Admin Routes
app.use('/api/v1/admin', require('./routes/adminRoutes'));
app.use('/api/v1/platform-settings', require('./routes/platformSettingsRoutes'));

// Business Modules (Tenant Scoped)
app.use('/api/v1/products', require('./routes/productRoutes'));
app.use('/api/v1/orders', require('./routes/orderRoutes'));
app.use('/api/v1/modules', require('./routes/moduleRoutes'));
app.use('/api/v1/tenant-admin', require('./routes/tenantAdminRoutes'));
app.use('/api/v1/categories', require('./routes/categoryRoutes'));
app.use('/api/v1/settings', require('./routes/settingsRoutes'));
app.use('/api/v1/billing', require('./routes/billingRoutes'));
app.use('/api/v1/shipping', require('./routes/shippingRoutes'));
app.use('/api/v1/brands', require('./routes/brandRoutes'));
app.use('/api/v1/reviews', require('./routes/reviewRoutes'));
app.use('/api/v1/customers', require('./routes/customerRoutes'));
app.use('/api/v1/inventory', require('./routes/inventoryRoutes'));
app.use('/api/v1/purchases', require('./routes/purchaseRoutes'));
app.use('/api/v1/accounting', require('./routes/accountingRoutes'));
app.use('/api/v1/crm', require('./routes/crmRoutes'));
app.use('/api/v1/marketing-v2', require('./routes/marketingRoutes'));
app.use('/api/v1/bi', require('./routes/biRoutes'));
app.use('/api/v1/channels', require('./routes/channelRoutes'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    startCronJobs();
});
