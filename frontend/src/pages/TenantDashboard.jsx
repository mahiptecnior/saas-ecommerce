import React, { useState, useEffect } from 'react';
import api from '../api/axios';

const TenantDashboard = () => {
    const [stats, setStats] = useState({
        products: 0,
        orders: 0,
        sales: '0.00'
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const productsRes = await api.get('/products');
                const ordersRes = await api.get('/orders');

                const totalSales = ordersRes.data.data.reduce((sum, order) => sum + parseFloat(order.total_amount), 0);

                setStats({
                    products: productsRes.data.data.length,
                    orders: ordersRes.data.data.length,
                    sales: totalSales.toFixed(2)
                });
            } catch (err) {
                console.error('Error fetching tenant stats', err);
            }
        };
        fetchStats();
    }, []);

    return (
        <div className="animate-fade-in">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <div className="card">
                    <p className="text-muted" style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>TOTAL PRODUCTS</p>
                    <h2 style={{ fontSize: '2rem' }}>{stats.products}</h2>
                </div>
                <div className="card">
                    <p className="text-muted" style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>TOTAL ORDERS</p>
                    <h2 style={{ fontSize: '2rem' }}>{stats.orders}</h2>
                </div>
                <div className="card">
                    <p className="text-muted" style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>GROSS SALES</p>
                    <h2 style={{ fontSize: '2rem' }}>${stats.sales}</h2>
                </div>
            </div>

            <div className="card">
                <h3>Store Overview</h3>
                <p className="text-muted">Manage your store operations.</p>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                    <button className="btn btn-primary" onClick={() => window.location.href = '/dashboard/products'}>Manage Products</button>
                    <button className="btn" style={{ background: '#f1f5f9', color: 'var(--text)' }} onClick={() => window.location.href = '/dashboard/orders'}>View Orders</button>
                </div>
            </div>
        </div>
    );
};

export default TenantDashboard;
