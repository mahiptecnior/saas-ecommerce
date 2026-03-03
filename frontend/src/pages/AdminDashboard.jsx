import React, { useState, useEffect } from 'react';
import api from '../api/axios';

const AdminDashboard = () => {
    const [stats, setStats] = useState({
        tenants: 0,
        plans: 0,
        revenue: '12,450.00' // Placeholder for now
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const tenantsRes = await api.get('/admin/tenants');
                const plansRes = await api.get('/admin/plans');
                setStats(prev => ({
                    ...prev,
                    tenants: tenantsRes.data.data.length,
                    plans: plansRes.data.data.length
                }));
            } catch (err) {
                console.error('Error fetching admin stats', err);
            }
        };
        fetchStats();
    }, []);

    return (
        <div className="animate-fade-in">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <div className="card">
                    <p className="text-muted" style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>TOTAL TENANTS</p>
                    <h2 style={{ fontSize: '2rem' }}>{stats.tenants}</h2>
                </div>
                <div className="card">
                    <p className="text-muted" style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>ACTIVE PLANS</p>
                    <h2 style={{ fontSize: '2rem' }}>{stats.plans}</h2>
                </div>
                <div className="card">
                    <p className="text-muted" style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>TOTAL REVENUE</p>
                    <h2 style={{ fontSize: '2rem' }}>${stats.revenue}</h2>
                    <span style={{ color: 'var(--success)', fontSize: '0.875rem', fontWeight: '600' }}>+12% from last month</span>
                </div>
            </div>

            <div className="card">
                <h3>System Overview</h3>
                <p className="text-muted">Quick actions for platform management.</p>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                    <button className="btn btn-primary" onClick={() => window.location.href = '/admin/tenants'}>Manage Tenants</button>
                    <button className="btn" style={{ background: '#f1f5f9', color: 'var(--text)' }} onClick={() => window.location.href = '/admin/plans'}>View Plans</button>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
