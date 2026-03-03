-- Create Database
CREATE DATABASE IF NOT EXISTS saas_ecom;
USE saas_ecom;

-- 1. Tenants
CREATE TABLE IF NOT EXISTS tenants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    subdomain VARCHAR(100) UNIQUE NOT NULL,
    domain VARCHAR(255) UNIQUE,
    business_name VARCHAR(255),
    business_address TEXT,
    business_tax_id VARCHAR(100),
    owner_name VARCHAR(255),
    owner_email VARCHAR(255),
    owner_phone VARCHAR(50),
    status ENUM('active', 'suspended', 'deactivated') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. Plans
CREATE TABLE IF NOT EXISTS plans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price_monthly DECIMAL(10, 2) NOT NULL,
    price_yearly DECIMAL(10, 2) NOT NULL,
    product_limit INT DEFAULT -1, -- -1 for unlimited
    order_limit INT DEFAULT -1,
    storage_limit_mb INT DEFAULT -1,
    staff_limit INT DEFAULT -1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Modules
CREATE TABLE IF NOT EXISTS modules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL, -- product, sales, marketing, etc.
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Plan Modules (Many-to-Many)
CREATE TABLE IF NOT EXISTS plan_modules (
    plan_id INT,
    module_id INT,
    PRIMARY KEY (plan_id, module_id),
    FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE CASCADE,
    FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE
);

-- 5. Tenant Modules (Dynamic Modules for specific tenants)
CREATE TABLE IF NOT EXISTS tenant_modules (
    tenant_id INT,
    module_id INT,
    PRIMARY KEY (tenant_id, module_id),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE
);

-- 6. Users
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id INT NULL, -- NULL for Super Admin
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('super_admin', 'tenant_owner', 'staff') NOT NULL,
    status BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- 7. Categories
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    parent_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    INDEX (tenant_id)
);

-- 8. Products
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    sku VARCHAR(100),
    inventory_quantity INT DEFAULT 0,
    status ENUM('active', 'draft', 'archived') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    INDEX (tenant_id)
);

-- 9. Orders
CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id INT NOT NULL,
    customer_id INT,
    total_amount DECIMAL(10, 2) NOT NULL,
    status ENUM('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
    payment_status ENUM('unpaid', 'paid', 'refunded') DEFAULT 'unpaid',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    INDEX (tenant_id)
);

-- 10. Order Items
CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id INT NOT NULL,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    INDEX (tenant_id)
);

-- 11. Subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id INT NOT NULL,
    plan_id INT NOT NULL,
    billing_cycle ENUM('monthly', 'yearly') NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status ENUM('active', 'expired', 'cancelled') DEFAULT 'active',
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE CASCADE,
    INDEX (tenant_id)
);

-- 12. Customers
CREATE TABLE IF NOT EXISTS customers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    INDEX (tenant_id)
);

-- 13. Transactions
CREATE TABLE IF NOT EXISTS transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id INT NOT NULL,
    order_id INT,
    amount DECIMAL(10, 2) NOT NULL,
    type ENUM('credit', 'debit') NOT NULL,
    payment_method VARCHAR(50),
    status ENUM('success', 'failed', 'pending') DEFAULT 'success',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
    INDEX (tenant_id)
);

-- 14. Tickets (Support)
CREATE TABLE IF NOT EXISTS tickets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id INT NOT NULL,
    user_id INT, -- Staff or Tenant Owner
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    status ENUM('open', 'in_progress', 'resolved', 'closed') DEFAULT 'open',
    priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    INDEX (tenant_id)
);

-- 15. Campaigns (Marketing)
CREATE TABLE IF NOT EXISTS campaigns (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    type ENUM('email', 'sms', 'push') NOT NULL,
    content TEXT,
    scheduled_at DATETIME,
    status ENUM('draft', 'scheduled', 'sent', 'failed') DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    INDEX (tenant_id)
);

-- 16. Coupons (Marketing)
CREATE TABLE IF NOT EXISTS coupons (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id INT NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    discount_type ENUM('percentage', 'fixed') NOT NULL,
    discount_value DECIMAL(10, 2) NOT NULL,
    expiry_date DATE,
    status BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    INDEX (tenant_id)
);

-- 17. Expenses (Accounts)
CREATE TABLE IF NOT EXISTS expenses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id INT NOT NULL,
    category VARCHAR(100) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    INDEX (tenant_id)
);

-- 18. Store Settings
CREATE TABLE IF NOT EXISTS store_settings (
    tenant_id INT PRIMARY KEY,
    store_name VARCHAR(255),
    currency VARCHAR(10) DEFAULT 'USD',
    logo_url VARCHAR(255),
    seo_title VARCHAR(255),
    seo_description TEXT,
    custom_css TEXT,
    builder_layout_json JSON,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- 18b. Platform Settings (Global configurations like SMTP)
CREATE TABLE IF NOT EXISTS platform_settings (
    setting_key VARCHAR(100) PRIMARY KEY,
    setting_value TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 19. Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id INT,
    user_id INT,
    action VARCHAR(255) NOT NULL,
    details TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- Add Stock Alerts and SKU to Products if not already covered well
ALTER TABLE products ADD COLUMN IF NOT EXISTS low_stock_threshold INT DEFAULT 5;
ALTER TABLE products ADD COLUMN IF NOT EXISTS tags VARCHAR(255);

-- Seed Initial Data Refinement
INSERT IGNORE INTO plans (name, price_monthly, price_yearly) VALUES ('Basic', 29.00, 290.00);
INSERT IGNORE INTO plans (name, price_monthly, price_yearly) VALUES ('Pro', 79.00, 790.00);
INSERT IGNORE INTO plans (name, price_monthly, price_yearly) VALUES ('Enterprise', 199.00, 1990.00);

-- All Modules as per list
INSERT IGNORE INTO modules (name) VALUES 
('product'), ('sales'), ('marketing'), ('accounts'), ('support'), ('theme_builder');

-- Default Plan Module Assign
-- (Assuming IDs for modules 1-6)
INSERT IGNORE INTO plan_modules (plan_id, module_id) VALUES 
(1, 1), (1, 2), -- Basic: Product, Sales
(2, 1), (2, 2), (2, 3), (2, 4), -- Pro: Product, Sales, Marketing, Accounts
(3, 1), (3, 2), (3, 3), (3, 4), (3, 5), (3, 6); -- Enterprise: All

-- Super Admin User (password: admin123)
INSERT IGNORE INTO users (name, email, password, role) VALUES ('Super Admin', 'admin@platform.com', '$2a$10$Xm/y0XzC4U8.I0w0.m9V.u7.vN.gS1YV.eY.zT0.q1.Y.r.f.S.U.', 'super_admin');
