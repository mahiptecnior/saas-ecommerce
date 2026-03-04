import React, { useState, useEffect } from 'react';
import api from '../api/axios';

const TenantDashboard = () => {
    const [stats, setStats] = useState({ products: 0, orders: 0, sales: '0.00' });
    const [recentOrders, setRecentOrders] = useState([]);
    const [modules, setModules] = useState([]);
    const [subscription, setSubscription] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const [productsRes, ordersRes] = await Promise.all([
                    api.get('/products'),
                    api.get('/orders')
                ]);

                const allOrders = ordersRes.data.data || [];
                const totalSales = allOrders.reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0);

                setStats({
                    products: productsRes.data.data?.length || 0,
                    orders: allOrders.length,
                    sales: totalSales.toFixed(2)
                });

                // Get the 5 most recent orders
                setRecentOrders(allOrders.slice(0, 5));

                // Try to fetch modules
                try {
                    const modulesRes = await api.get('/tenant/modules');
                    setModules(modulesRes.data.data || []);
                } catch (e) { /* modules endpoint may not exist for all tenants */ }

                // Try to fetch subscription
                try {
                    const subRes = await api.get('/tenant/subscription');
                    setSubscription(subRes.data.data || null);
                } catch (e) { /* subscription endpoint may not exist */ }

            } catch (err) {
                console.error('Error fetching tenant stats', err);
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, []);

    const statusColor = (status) => {
        const map = { pending: '#f59e0b', processing: '#3b82f6', shipped: '#8b5cf6', delivered: '#10b981', cancelled: '#ef4444' };
        return map[status] || '#6b7280';
    };

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading dashboard...</div>;

    return (
        <div className="animate-fade-in">
            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <div className="card">
                    <p className="text-muted" style={{ fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Total Products</p>
                    <h2 style={{ fontSize: '2rem' }}>{stats.products}</h2>
                </div>
                <div className="card">
                    <p className="text-muted" style={{ fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Total Orders</p>
                    <h2 style={{ fontSize: '2rem' }}>{stats.orders}</h2>
                </div>
                <div className="card">
                    <p className="text-muted" style={{ fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Gross Sales</p>
                    <h2 style={{ fontSize: '2rem', color: 'var(--success)' }}>${stats.sales}</h2>
                </div>
                {subscription && (
                    <div className="card">
                        <p className="text-muted" style={{ fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Current Plan</p>
                        <h2 style={{ fontSize: '1.5rem' }}>{subscription.plan_name || 'Free'}</h2>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {subscription.status === 'active' ? '✅ Active' : subscription.status === 'trial' ? '🎁 Trial' : '⚠️ ' + subscription.status}
                            {subscription.end_date && ` • Expires ${new Date(subscription.end_date).toLocaleDateString()}`}
                        </p>
                    </div>
                )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
                {/* Recent Orders */}
                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3>Recent Orders</h3>
                        <button className="btn btn-outline" style={{ fontSize: '0.8rem', padding: '0.3rem 0.7rem' }} onClick={() => window.location.href = '/dashboard/orders'}>View All</button>
                    </div>
                    {recentOrders.length === 0 ? (
                        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>No orders yet.</p>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--border)', fontSize: '0.8rem', textAlign: 'left', color: 'var(--text-muted)' }}>
                                    <th style={{ padding: '0.5rem' }}>Order</th>
                                    <th style={{ padding: '0.5rem' }}>Customer</th>
                                    <th style={{ padding: '0.5rem' }}>Total</th>
                                    <th style={{ padding: '0.5rem' }}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentOrders.map(order => (
                                    <tr key={order.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                        <td style={{ padding: '0.5rem', fontFamily: 'monospace', fontSize: '0.85rem' }}>#{order.id}</td>
                                        <td style={{ padding: '0.5rem', fontSize: '0.85rem' }}>{order.customer_name || order.customer_email || '—'}</td>
                                        <td style={{ padding: '0.5rem', fontWeight: '600' }}>${Number(order.total_amount).toFixed(2)}</td>
                                        <td style={{ padding: '0.5rem' }}>
                                            <span style={{ padding: '0.15rem 0.4rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: '600', color: '#fff', backgroundColor: statusColor(order.status) }}>
                                                {(order.status || 'pending').toUpperCase()}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Quick Actions + Modules */}
                <div>
                    <div className="card" style={{ marginBottom: '1.5rem' }}>
                        <h3 style={{ marginBottom: '1rem' }}>Quick Actions</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => window.location.href = '/dashboard/products'}>📦 Manage Products</button>
                            <button className="btn btn-outline" style={{ width: '100%' }} onClick={() => window.location.href = '/dashboard/orders'}>🛒 View Orders</button>
                            <button className="btn btn-outline" style={{ width: '100%' }} onClick={() => window.location.href = '/dashboard/marketing'}>📣 Marketing</button>
                            <button className="btn btn-outline" style={{ width: '100%' }} onClick={() => window.location.href = '/dashboard/settings'}>⚙️ Settings</button>
                        </div>
                    </div>

                    {modules.length > 0 && (
                        <div className="card">
                            <h3 style={{ marginBottom: '0.75rem' }}>Active Modules</h3>
                            {modules.map(m => (
                                <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0', borderBottom: '1px solid var(--border)' }}>
                                    <span style={{ color: 'var(--success)' }}>✓</span>
                                    <span style={{ fontSize: '0.85rem' }}>{m.name}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TenantDashboard;
