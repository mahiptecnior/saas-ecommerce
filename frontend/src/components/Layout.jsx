import React, { useState, useEffect } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import api from '../api/axios';

const Layout = ({ role }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const user = JSON.parse(localStorage.getItem('user'));
    const userName = user?.name || 'User';
    const [activeModules, setActiveModules] = useState([]);

    useEffect(() => {
        if (role === 'tenant_owner' && user?.tenant_id) {
            fetchTenantModules();
        }
    }, [role]);

    const fetchTenantModules = async () => {
        try {
            const res = await api.get(`/admin/tenants/${user.tenant_id}/modules`);
            setActiveModules(res.data.data.map(m => m.name));
        } catch (error) {
            console.error('Error fetching modules', error);
            // Default to basic modules if error
            setActiveModules(['product', 'sales']);
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    const adminMenu = [
        { name: 'Dashboard', path: '/admin', roles: ['super_admin'] },
        { name: 'Tenants', path: '/admin/tenants', roles: ['super_admin'] },
        { name: 'Plans', path: '/admin/plans', roles: ['super_admin'] },
        { name: 'Module Features', path: '/admin/modules', roles: ['super_admin'] },
        { name: 'Tenant Config', path: '/admin/assignments', roles: ['super_admin'] },
        { name: 'Gateways', path: '/admin/gateways', roles: ['super_admin'] },
        { name: 'Transactions', path: '/admin/transactions', roles: ['super_admin'] },
        { name: 'Audit Logs', path: '/admin/audit-logs', roles: ['super_admin'] },
        { name: 'Add-Ons', path: '/admin/addons', roles: ['super_admin'] },
        { name: 'Invoices', path: '/admin/invoices', roles: ['super_admin'] },
        { name: 'Themes', path: '/admin/themes', roles: ['super_admin'] },
        { name: 'Security', path: '/admin/security', roles: ['super_admin'] },
        { name: '🎧 Support Center', path: '/admin/support', roles: ['super_admin'] },
        { name: 'Platform Settings', path: '/admin/platform-settings', roles: ['super_admin'] },
    ];

    const tenantMenu = [
        { name: 'Dashboard', path: '/dashboard', module: 'core', icon: '📊' },
        { name: 'Products', path: '/dashboard/products', module: 'product', icon: '📦' },
        { name: 'Categories', path: '/dashboard/categories', module: 'product', icon: '📁' },
        { name: 'Brands', path: '/dashboard/brands', module: 'product', icon: '🏷️' },
        { name: 'Reviews', path: '/dashboard/reviews', module: 'product', icon: '⭐' },
        { name: '👥 Customers', path: '/dashboard/customers', module: 'core', icon: '👥' },
        { name: 'Orders', path: '/dashboard/orders', module: 'sales', icon: '🛍️' },
        { name: 'POS (Point of Sale)', path: '/dashboard/pos', module: 'sales', icon: '🏪' },
        { name: '📦 Inventory', path: '/dashboard/inventory', module: 'core', icon: '🏭' },
        { name: '🛒 Purchases', path: '/dashboard/purchases', module: 'core', icon: '💳' },
        { name: 'Marketing', path: '/dashboard/marketing', module: 'core', icon: '📣' },
        { name: 'Accounts', path: '/dashboard/accounts', module: 'core', icon: '💰' },
        { name: '🤝 CRM / Pipeline', path: '/dashboard/crm', module: 'core', icon: '🤝' },
        { name: '❓ FAQ Manager', path: '/dashboard/faq', module: 'core', icon: '❓' },
        { name: '📈 BI / Analytics', path: '/dashboard/bi', module: 'core', icon: '📈' },
        { name: '🔗 Multi-Channel', path: '/dashboard/multi-channel', module: 'core', icon: '🔗' },
        { name: 'Support', path: '/dashboard/support', module: 'core', icon: '🎧' },
        { name: 'Theme Builder', path: '/dashboard/builder', module: 'theme_builder', icon: '🎨' },
        { name: 'Settings', path: '/dashboard/settings', module: 'core', icon: '⚙️' },
    ];

    // Only show Roles and Staff to the store owner (role_id is null)
    if (user && user.role_id == null) {
        tenantMenu.push({ name: 'Roles', path: '/dashboard/roles', module: 'core', icon: '💂' });
        tenantMenu.push({ name: 'Staff', path: '/dashboard/staff', module: 'core', icon: '🧑‍💼' });
    }

    const filteredMenu = role === 'super_admin'
        ? adminMenu
        : tenantMenu.filter(item => item.module === 'core' || activeModules.includes(item.module));

    return (
        <div className="layout" style={{ backgroundColor: '#fcfcfd', minHeight: '100vh', display: 'flex' }}>
            <div className="sidebar" style={{
                height: '100vh',
                overflowY: 'auto',
                position: 'fixed',
                left: 0,
                top: 0,
                width: '280px',
                borderRight: '1px solid #f1f1f4',
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: '#ffffff',
                boxShadow: '4px 0 24px rgba(0,0,0,0.02)',
                zIndex: 100
            }}>
                <div style={{ padding: '2.5rem 2rem', fontSize: '1.6rem', fontWeight: '800', fontFamily: 'Outfit, sans-serif', color: 'var(--primary)', letterSpacing: '-0.04em', position: 'sticky', top: 0, backgroundColor: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)', zIndex: 10 }}>
                    🚀 Nazmart
                </div>
                <nav style={{ flex: 1, padding: '0.5rem 1.25rem', marginBottom: '6rem' }}>
                    {filteredMenu.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                padding: '0.9rem 1.25rem',
                                margin: '0.4rem 0',
                                textDecoration: 'none',
                                color: location.pathname === item.path ? 'var(--primary)' : '#64748b',
                                fontWeight: location.pathname === item.path ? '700' : '500',
                                backgroundColor: location.pathname === item.path ? 'rgba(79, 70, 229, 0.06)' : 'transparent',
                                borderRadius: '14px',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                fontSize: '0.92rem'
                            }}
                        >
                            <span style={{ marginRight: '1rem', fontSize: '1.1rem', filter: location.pathname === item.path ? 'none' : 'grayscale(100%) opacity(0.7)' }}>{item.icon || '🔹'}</span>
                            {item.name}
                        </Link>
                    ))}
                </nav>
                <div style={{ position: 'sticky', bottom: 0, width: '100%', padding: '1.5rem 1.5rem 2rem', backgroundColor: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)', borderTop: '1px solid #f1f5f9' }}>
                    <button className="btn" style={{ width: '100%', backgroundColor: '#f1f5f9', color: '#475569', borderRadius: '12px', padding: '0.8rem', fontWeight: '600', border: 'none', cursor: 'pointer', transition: 'background 0.2s' }} onClick={handleLogout}>
                        Logout Session
                    </button>
                </div>
            </div>
            <main className="main-content" style={{ marginLeft: '280px', flex: 1, padding: '2.5rem 3.5rem', minHeight: '100vh' }}>
                <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3.5rem', alignItems: 'center' }}>
                    <div>
                        <h1 style={{ marginBottom: '0.5rem', fontSize: '2rem', fontWeight: '800', letterSpacing: '-0.03em' }}>
                            {filteredMenu.find(m => m.path === location.pathname)?.name.replace(/[^a-zA-Z\s]/g, '').trim() || 'Dashboard'}
                        </h1>
                        <div style={{ fontSize: '0.95rem', color: '#94a3b8', fontWeight: '500' }}>
                            {role === 'super_admin' ? 'Platform Command Center' : `Welcome back, ${userName}`}
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ height: '44px', width: '44px', borderRadius: '12px', backgroundColor: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '1.2rem' }}>
                            {userName[0]}
                        </div>
                    </div>
                </header>
                <div className="fade-in">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default Layout;
