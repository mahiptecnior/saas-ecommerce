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
        { name: 'Platform Settings', path: '/admin/platform-settings', roles: ['super_admin'] },
    ];

    const tenantMenu = [
        { name: 'Dashboard', path: '/dashboard', module: 'core' },
        { name: 'Products', path: '/dashboard/products', module: 'product' },
        { name: 'Categories', path: '/dashboard/categories', module: 'product' },
        { name: 'Orders', path: '/dashboard/orders', module: 'sales' },
        { name: 'Marketing', path: '/dashboard/marketing', module: 'marketing' },
        { name: 'Accounts', path: '/dashboard/accounts', module: 'accounts' },
        { name: 'Support', path: '/dashboard/support', module: 'support' },
        { name: 'Builder', path: '/dashboard/builder', module: 'theme_builder' },
        { name: 'Settings', path: '/dashboard/settings', module: 'core' },
    ];

    const filteredMenu = role === 'super_admin'
        ? adminMenu
        : tenantMenu.filter(item => item.module === 'core' || activeModules.includes(item.module));

    return (
        <div className="layout">
            <div className="sidebar">
                <div style={{ padding: '2.5rem 2rem', fontSize: '1.5rem', fontWeight: '700', fontFamily: 'Outfit, sans-serif', color: 'var(--primary)', letterSpacing: '-0.02em' }}>
                    SaaS eCommerce
                </div>
                <nav style={{ flex: 1, padding: '0 1.25rem' }}>
                    {filteredMenu.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
                            style={{
                                display: 'block',
                                padding: '0.85rem 1.25rem',
                                margin: '0.25rem 0',
                                textDecoration: 'none',
                                color: location.pathname === item.path ? 'var(--primary)' : 'var(--text-muted)',
                                fontWeight: location.pathname === item.path ? '600' : '500',
                                backgroundColor: location.pathname === item.path ? '#eef2ff' : 'transparent',
                                borderRadius: '12px',
                                transition: 'all 0.2s ease',
                            }}
                        >
                            {item.name}
                        </Link>
                    ))}
                </nav>
                <div style={{ position: 'absolute', bottom: '2rem', width: '100%', padding: '0 2rem' }}>
                    <button className="btn" style={{ width: '100%', backgroundColor: 'var(--border)' }} onClick={handleLogout}>
                        Logout
                    </button>
                </div>
            </div>
            <main className="main-content">
                <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2.5rem', alignItems: 'center' }}>
                    <div>
                        <h1 style={{ marginBottom: '0.25rem' }}>Overview</h1>
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                            {role === 'super_admin' ? 'Platform Administrator' : 'Store Management'}
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
