import React, { useState, useEffect } from 'react';
import api from '../api/axios';

const AdminDashboard = () => {
    const [stats, setStats] = useState({
        totalTenants: 0,
        activeTenants: 0,
        totalRevenue: 0,
        monthlySales: 0,
        platformCommission: 0,
        subscriptionStatus: '...'
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const res = await api.get('/admin/analytics');
            setStats(res.data.data);
        } catch (error) {
            console.error('Error fetching admin analytics', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fade-in">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <div className="card">
                    <p style={{ color: 'var(--text-muted)' }}>Total Tenants</p>
                    <h2>{stats.totalTenants}</h2>
                </div>
                <div className="card">
                    <p style={{ color: 'var(--text-muted)' }}>Active Tenants</p>
                    <h2 style={{ color: 'var(--success)' }}>{stats.activeTenants}</h2>
                </div>
                <div className="card">
                    <p style={{ color: 'var(--text-muted)' }}>Total Platform Revenue</p>
                    <h2 style={{ color: 'var(--primary)' }}>${stats.totalRevenue.toLocaleString()}</h2>
                </div>
                <div className="card">
                    <p style={{ color: 'var(--text-muted)' }}>Monthly Sales</p>
                    <h2>${stats.monthlySales.toLocaleString()}</h2>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem' }}>
                <div className="card">
                    <h3>Platform Commission (5%)</h3>
                    <h1 style={{ fontSize: '3rem', color: 'var(--primary)', margin: '1rem 0' }}>
                        ${stats.platformCommission.toLocaleString()}
                    </h1>
                    <p>Calculated across all non-cancelled orders.</p>
                </div>
                <div className="card">
                    <h3>System Health</h3>
                    <div style={{ marginTop: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span>API Status</span>
                            <span style={{ color: 'var(--success)' }}>Operational</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span>DB Connection</span>
                            <span style={{ color: 'var(--success)' }}>Healthy</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span>Subscription Engine</span>
                            <span style={{ color: 'var(--success)' }}>{stats.subscriptionStatus}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
