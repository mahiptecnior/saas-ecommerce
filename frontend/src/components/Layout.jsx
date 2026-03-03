import React from 'react';
import { useNavigate, Link, Outlet } from 'react-router-dom';

const Layout = ({ role }) => {
    const navigate = useNavigate();
    const userName = JSON.parse(localStorage.getItem('user'))?.name || 'User';

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    const adminMenu = [
        { name: 'Dashboard', path: '/admin' },
        { name: 'Tenants', path: '/admin/tenants' },
        { name: 'Plans', path: '/admin/plans' },
    ];

    const tenantMenu = [
        { name: 'Dashboard', path: '/dashboard' },
        { name: 'Products', path: '/dashboard/products' },
        { name: 'Orders', path: '/dashboard/orders' },
        { name: 'Settings', path: '/dashboard/settings' },
    ];

    const menu = role === 'super_admin' ? adminMenu : tenantMenu;

    return (
        <div className="layout">
            <div className="sidebar">
                <div style={{ padding: '2rem', fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                    SaaS eCommerce
                </div>
                <nav style={{ marginTop: '1rem' }}>
                    {menu.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            style={{
                                display: 'block',
                                padding: '0.75rem 2rem',
                                textDecoration: 'none',
                                color: 'var(--text)',
                                borderLeft: '4px solid transparent'
                            }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--background)'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                        >
                            {item.name}
                        </Link>
                    ))}
                </nav>
                <div style={{ position: 'absolute', bottom: '2rem', width: '100%', padding: '0 2rem' }}>
                    <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleLogout}>
                        Logout
                    </button>
                </div>
            </div>
            <main className="main-content">
                <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                    <h1>Welcome, {userName}</h1>
                </header>
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;
