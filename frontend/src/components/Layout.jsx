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
        { name: 'System', path: '/admin/system', roles: ['super_admin'] },
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
                <div style={{ padding: '2rem', fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                    SaaS eCommerce
                </div>
                <nav style={{ marginTop: '1rem' }}>
                    {filteredMenu.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
                            style={{
                                display: 'block',
                                padding: '0.75rem 2rem',
                                textDecoration: 'none',
                                color: location.pathname === item.path ? 'var(--primary)' : 'var(--text)',
                                borderLeft: location.pathname === item.path ? '4px solid var(--primary)' : '4px solid transparent',
                                backgroundColor: location.pathname === item.path ? 'var(--background)' : 'transparent',
                                transition: 'all 0.2s'
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
                <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', alignItems: 'center' }}>
                    <h1>Welcome, {userName}</h1>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                        {role === 'super_admin' ? 'Platform Administrator' : 'Store Management'}
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
