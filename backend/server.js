const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const tenantContext = require('./middleware/tenantContext');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(tenantContext);

// Routes Placeholder
app.get('/', (req, res) => {
    res.json({ message: 'SaaS eCommerce API is running' });
});

// Authentication Routes
app.use('/api/v1/auth', require('./routes/authRoutes'));

// Super Admin Routes
app.use('/api/v1/admin', require('./routes/adminRoutes'));

// Business Modules (Tenant Scoped)
app.use('/api/v1/products', require('./routes/productRoutes'));
app.use('/api/v1/orders', require('./routes/orderRoutes'));
app.use('/api/v1/modules', require('./routes/moduleRoutes'));
app.use('/api/v1/categories', require('./routes/categoryRoutes'));
app.use('/api/v1/settings', require('./routes/settingsRoutes'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
