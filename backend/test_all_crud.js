const http = require('http');

const BASE = 'http://localhost:5001/api/v1';

function req(method, path, token, body = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(BASE + path);
        const opts = {
            hostname: url.hostname, port: url.port, path: url.pathname + url.search,
            method, headers: { 'Content-Type': 'application/json' }
        };
        if (token) opts.headers['Authorization'] = 'Bearer ' + token;
        const r = http.request(opts, res => {
            let d = '';
            res.on('data', c => d += c);
            res.on('end', () => {
                try { resolve({ status: res.statusCode, data: JSON.parse(d) }); }
                catch { resolve({ status: res.statusCode, data: d }); }
            });
        });
        r.on('error', reject);
        if (body) r.write(JSON.stringify(body));
        r.end();
    });
}

async function run() {
    const results = [];
    const log = (module, op, status, detail) => {
        const icon = status >= 200 && status < 300 ? '✅' : status < 500 ? '⚠️' : '❌';
        results.push({ module, op, status, icon, detail });
        console.log(`${icon} [${module}] ${op}: ${status} - ${detail}`);
    };

    // 1. Login as Super Admin
    const adminLogin = await req('POST', '/auth/login', null, { email: 'admin@platform.com', password: 'admin123' });
    const AT = adminLogin.data.token;
    log('Auth', 'Admin Login', adminLogin.status, AT ? 'Token received' : 'FAILED');

    // 2. Login as Tenant (reset password first)
    const bcrypt = require('bcryptjs');
    const mysql = require('mysql2/promise');
    const pool = mysql.createPool({ host: 'localhost', user: 'root', password: '', database: 'saas_ecom' });
    const hash = await bcrypt.hash('test123', 10);
    await pool.query("UPDATE users SET password = ? WHERE email = 'test@store.com'", [hash]);
    const tenantLogin = await req('POST', '/auth/login', null, { email: 'test@store.com', password: 'test123' });
    const TT = tenantLogin.data.token;
    log('Auth', 'Tenant Login', tenantLogin.status, TT ? 'Token received' : 'FAILED');

    if (!AT || !TT) { console.log('Cannot proceed without tokens'); process.exit(1); }

    // ==================== SUPER ADMIN MODULES ====================
    console.log('\n========== SUPER ADMIN ENDPOINTS ==========');

    // Admin Dashboard / Analytics
    const analytics = await req('GET', '/admin/analytics', AT);
    log('AdminDashboard', 'GET analytics', analytics.status, analytics.data.success ? 'OK' : analytics.data.message);

    // Tenants CRUD
    const tenants = await req('GET', '/admin/tenants', AT);
    log('Tenants', 'GET list', tenants.status, `${tenants.data.data?.length || 0} tenants`);

    // Plans CRUD
    const plans = await req('GET', '/admin/plans', AT);
    log('Plans', 'GET list', plans.status, `${plans.data.data?.length || 0} plans`);
    const newPlan = await req('POST', '/admin/plans', AT, { name: 'TestPlan', price: 99, duration_days: 30, max_products: 100, max_orders: 500, max_staff: 5 });
    log('Plans', 'CREATE', newPlan.status, newPlan.data.success ? `ID: ${newPlan.data.data?.id}` : newPlan.data.message);
    if (newPlan.data.data?.id) {
        const upPlan = await req('PUT', `/admin/plans/${newPlan.data.data.id}`, AT, { name: 'TestPlanUpdated', price: 199, duration_days: 30, max_products: 200, max_orders: 1000, max_staff: 10 });
        log('Plans', 'UPDATE', upPlan.status, upPlan.data.message || 'OK');
        const delPlan = await req('DELETE', `/admin/plans/${newPlan.data.data.id}`, AT);
        log('Plans', 'DELETE', delPlan.status, delPlan.data.message || 'OK');
    }

    // Modules CRUD
    const mods = await req('GET', '/admin/modules', AT);
    log('Modules', 'GET list', mods.status, `${mods.data.data?.length || 0} modules`);

    // Addons CRUD
    const addons = await req('GET', '/admin/addons', AT);
    log('Addons', 'GET list', addons.status, `${addons.data.data?.length || 0} addons`);
    const newAddon = await req('POST', '/admin/addons', AT, { name: 'TestAddon', description: 'Test', price_monthly: 10 });
    log('Addons', 'CREATE', newAddon.status, newAddon.data.success ? `ID: ${newAddon.data.data?.id}` : newAddon.data.message);
    if (newAddon.data.data?.id) {
        const delAddon = await req('DELETE', `/admin/addons/${newAddon.data.data.id}`, AT);
        log('Addons', 'DELETE', delAddon.status, delAddon.data.message || 'OK');
    }

    // Invoices
    const invoices = await req('GET', '/admin/invoices', AT);
    log('Invoices', 'GET list', invoices.status, `${invoices.data.data?.length || 0} invoices`);

    // Themes CRUD
    const themes = await req('GET', '/admin/themes', AT);
    log('Themes', 'GET list', themes.status, `${themes.data.data?.length || 0} themes`);
    const newTheme = await req('POST', '/admin/themes', AT, { name: 'TestTheme', css_variables: '{}', is_default: 0 });
    log('Themes', 'CREATE', newTheme.status, newTheme.data.success ? `ID: ${newTheme.data.data?.id}` : newTheme.data.message);
    if (newTheme.data.data?.id) {
        const delTheme = await req('DELETE', `/admin/themes/${newTheme.data.data.id}`, AT);
        log('Themes', 'DELETE', delTheme.status, delTheme.data.message || 'OK');
    }

    // Audit Logs
    const audit = await req('GET', '/admin/audit-logs', AT);
    log('AuditLogs', 'GET list', audit.status, `${audit.data.data?.length || 0} logs`);

    // Gateways
    const gateways = await req('GET', '/admin/gateways', AT);
    log('Gateways', 'GET list', gateways.status, gateways.data.success !== undefined ? (gateways.data.success ? 'OK' : gateways.data.message) : `Status ${gateways.status}`);

    // Transactions
    const txns = await req('GET', '/admin/transactions', AT);
    log('Transactions', 'GET list', txns.status, txns.data.success !== undefined ? (txns.data.success ? 'OK' : txns.data.message) : `Status ${txns.status}`);

    // Security
    const backups = await req('GET', '/admin/backups', AT);
    log('Security', 'GET backups', backups.status, backups.data.success ? 'OK' : backups.data.message);
    const ipwl = await req('GET', '/admin/ip-whitelist', AT);
    log('Security', 'GET ip-whitelist', ipwl.status, ipwl.data.success ? 'OK' : ipwl.data.message);

    // Admin Support
    const adminTickets = await req('GET', '/admin/support/tickets', AT);
    log('AdminSupport', 'GET tickets', adminTickets.status, `${adminTickets.data.data?.length || 0} tickets`);

    // Platform Settings
    const platSettings = await req('GET', '/platform-settings', AT);
    log('PlatformSettings', 'GET', platSettings.status, platSettings.data.success ? 'OK' : platSettings.data.message);

    // ==================== TENANT ENDPOINTS ====================
    console.log('\n========== TENANT ENDPOINTS ==========');

    // Products CRUD
    const products = await req('GET', '/products', TT);
    log('Products', 'GET list', products.status, `${products.data.data?.length || 0} products`);
    const newProd = await req('POST', '/products', TT, { name: 'TestProduct', price: 49.99, stock: 100, category_id: null, description: 'Test product' });
    log('Products', 'CREATE', newProd.status, newProd.data.success ? `ID: ${newProd.data.data?.id}` : newProd.data.message);
    if (newProd.data.data?.id) {
        const upProd = await req('PUT', `/products/${newProd.data.data.id}`, TT, { name: 'TestProductUpdated', price: 59.99, stock: 200, description: 'Updated' });
        log('Products', 'UPDATE', upProd.status, upProd.data.message || 'OK');
        const delProd = await req('DELETE', `/products/${newProd.data.data.id}`, TT);
        log('Products', 'DELETE', delProd.status, delProd.data.message || 'OK');
    }

    // Categories CRUD
    const cats = await req('GET', '/categories', TT);
    log('Categories', 'GET list', cats.status, `${cats.data.data?.length || 0} categories`);
    const newCat = await req('POST', '/categories', TT, { name: 'TestCategory' });
    log('Categories', 'CREATE', newCat.status, newCat.data.success ? `ID: ${newCat.data.data?.id}` : newCat.data.message);
    if (newCat.data.data?.id) {
        const delCat = await req('DELETE', `/categories/${newCat.data.data.id}`, TT);
        log('Categories', 'DELETE', delCat.status, delCat.data.message || 'OK');
    }

    // Orders
    const orders = await req('GET', '/orders', TT);
    log('Orders', 'GET list', orders.status, `${orders.data.data?.length || 0} orders`);

    // Brands CRUD
    const brands = await req('GET', '/brands', TT);
    log('Brands', 'GET list', brands.status, `${brands.data.data?.length || 0} brands`);
    const newBrand = await req('POST', '/brands', TT, { name: 'TestBrand' });
    log('Brands', 'CREATE', newBrand.status, newBrand.data.success ? `ID: ${newBrand.data.data?.id}` : newBrand.data.message);
    if (newBrand.data.data?.id) {
        const delBrand = await req('DELETE', `/brands/${newBrand.data.data.id}`, TT);
        log('Brands', 'DELETE', delBrand.status, delBrand.data.message || 'OK');
    }

    // Customers
    const custs = await req('GET', '/customers', TT);
    log('Customers', 'GET list', custs.status, `${custs.data.data?.length || 0} customers`);

    // Marketing - Coupons CRUD
    const coupons = await req('GET', '/modules/marketing/coupons', TT);
    log('Marketing', 'GET coupons', coupons.status, `${coupons.data.data?.length || 0} coupons`);
    const newCoupon = await req('POST', '/modules/marketing/coupons', TT, { code: 'TESTCRUD', discount_type: 'percentage', discount_value: 10, min_order: 50, max_uses: 100, expiry_date: '2026-12-31' });
    log('Marketing', 'CREATE coupon', newCoupon.status, newCoupon.data.success ? `ID: ${newCoupon.data.data?.id}` : newCoupon.data.message);
    if (newCoupon.data.data?.id) {
        const delCoupon = await req('DELETE', `/modules/marketing/coupons/${newCoupon.data.data.id}`, TT);
        log('Marketing', 'DELETE coupon', delCoupon.status, delCoupon.data.message || 'OK');
    }

    // Marketing - Campaigns
    const campaigns = await req('GET', '/modules/marketing/campaigns', TT);
    log('Marketing', 'GET campaigns', campaigns.status, `${campaigns.data.data?.length || 0} campaigns`);

    // Accounts - Expenses
    const expenses = await req('GET', '/modules/accounts/expenses', TT);
    log('Accounts', 'GET expenses', expenses.status, `${expenses.data.data?.length || 0} expenses`);
    const newExp = await req('POST', '/modules/accounts/expenses', TT, { title: 'TestExpense', amount: 50.00, category: 'office', date: '2026-03-04' });
    log('Accounts', 'CREATE expense', newExp.status, newExp.data.success ? `ID: ${newExp.data.data?.id}` : newExp.data.message);
    if (newExp.data.data?.id) {
        const delExp = await req('DELETE', `/modules/accounts/expenses/${newExp.data.data.id}`, TT);
        log('Accounts', 'DELETE expense', delExp.status, delExp.data.message || 'OK');
    }

    // Accounts - Summary
    const finSummary = await req('GET', '/modules/accounts/summary', TT);
    log('Accounts', 'GET summary', finSummary.status, finSummary.data.success ? 'OK' : finSummary.data.message);

    // CRM
    const companies = await req('GET', '/crm/companies', TT);
    log('CRM', 'GET companies', companies.status, `${companies.data.data?.length || 0} companies`);
    const newCompany = await req('POST', '/crm/companies', TT, { name: 'TestCompany', contact_name: 'Test', contact_email: 'test@test.com', phone: '1234567890', stage: 'lead' });
    log('CRM', 'CREATE company', newCompany.status, newCompany.data.success ? `ID: ${newCompany.data.data?.id}` : newCompany.data.message);
    if (newCompany.data.data?.id) {
        const delComp = await req('DELETE', `/crm/companies/${newCompany.data.data.id}`, TT);
        log('CRM', 'DELETE company', delComp.status, delComp.data.message || 'OK');
    }

    // Support - Tickets
    const tickets = await req('GET', '/modules/support/tickets', TT);
    log('Support', 'GET tickets', tickets.status, `${tickets.data.data?.length || 0} tickets`);
    const newTicket = await req('POST', '/modules/support/tickets', TT, { subject: 'TestTicket', message: 'Testing CRUD', priority: 'medium' });
    log('Support', 'CREATE ticket', newTicket.status, newTicket.data.success ? `ID: ${newTicket.data.data?.id}` : newTicket.data.message);

    // Inventory
    const inv = await req('GET', '/inventory', TT);
    log('Inventory', 'GET list', inv.status, `${inv.data.data?.length || 0} items`);

    // Purchases
    const purch = await req('GET', '/purchases', TT);
    log('Purchases', 'GET list', purch.status, `${purch.data.data?.length || 0} purchases`);

    // Reviews
    const reviews = await req('GET', '/reviews', TT);
    log('Reviews', 'GET list', reviews.status, `${reviews.data.data?.length || 0} reviews`);

    // Channels (Multi-Channel)
    const channels = await req('GET', '/channels', TT);
    log('Channels', 'GET list', channels.status, `${channels.data.data?.length || 0} channels`);

    // BI / Analytics
    const biSales = await req('GET', '/bi/sales-trend', TT);
    log('BI', 'GET sales-trend', biSales.status, biSales.data.success ? 'OK' : biSales.data.message);

    // Settings
    const settings = await req('GET', '/settings', TT);
    log('Settings', 'GET', settings.status, settings.data.success ? `smtp_host=${settings.data.data?.smtp_host || 'empty'}` : settings.data.message);

    // Shipping
    const shipping = await req('GET', '/shipping', TT);
    log('Shipping', 'GET list', shipping.status, `${shipping.data.data?.length || 0} rules`);

    // Roles
    const roles = await req('GET', '/tenant-admin/roles', TT);
    log('Roles', 'GET list', roles.status, roles.data.success ? `${roles.data.data?.length || 0} roles` : roles.data.message);

    // Staff
    const staff = await req('GET', '/tenant-admin/staff', TT);
    log('Staff', 'GET list', staff.status, staff.data.success ? `${staff.data.data?.length || 0} staff` : staff.data.message);

    // ==================== SUMMARY ====================
    console.log('\n========== SUMMARY ==========');
    const passed = results.filter(r => r.status >= 200 && r.status < 300).length;
    const warned = results.filter(r => r.status >= 300 && r.status < 500).length;
    const failed = results.filter(r => r.status >= 500).length;
    console.log(`Total: ${results.length} | ✅ Passed: ${passed} | ⚠️ Warnings: ${warned} | ❌ Failed: ${failed}`);

    if (failed > 0 || warned > 0) {
        console.log('\nIssues:');
        results.filter(r => r.status >= 300).forEach(r => console.log(`  ${r.icon} [${r.module}] ${r.op}: ${r.status} - ${r.detail}`));
    }

    await pool.end();
    process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });
