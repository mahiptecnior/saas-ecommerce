import React, { useState, useEffect } from 'react';
import api from '../api/axios';

const AdminDashboard = () => {
    const [stats, setStats] = useState({
        totalTenants: 0,
        activeTenants: 0,
        totalRevenue: 0,
        monthlySales: 0,
        platformCommission: 0,
        subscriptionStatus: '...',
        mrr: 0,
        arr: 0,
        planRevenue: [],
        monthlyTrend: [],
        tenantTrend: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchStats(); }, []);

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

    const maxRevenue = Math.max(...(stats.monthlyTrend?.map(m => m.revenue) || [1]), 1);
    const maxTenants = Math.max(...(stats.tenantTrend?.map(m => m.new_tenants) || [1]), 1);

    return (
        <div className="fade-in">
            {/* KPI Cards Row 1 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <div className="card">
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Total Tenants</p>
                    <h2>{stats.totalTenants}</h2>
                </div>
                <div className="card">
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Active Tenants</p>
                    <h2 style={{ color: 'var(--success)' }}>{stats.activeTenants}</h2>
                </div>
                <div className="card" style={{ borderLeft: '4px solid var(--primary)' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>MRR</p>
                    <h2 style={{ color: 'var(--primary)' }}>${Number(stats.mrr || 0).toLocaleString()}</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.25rem' }}>Monthly Recurring Revenue</p>
                </div>
                <div className="card" style={{ borderLeft: '4px solid var(--success)' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>ARR</p>
                    <h2 style={{ color: 'var(--success)' }}>${Number(stats.arr || 0).toLocaleString()}</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.25rem' }}>Annual Recurring Revenue</p>
                </div>
            </div>

            {/* KPI Cards Row 2 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <div className="card">
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Total Revenue</p>
                    <h2 style={{ color: 'var(--primary)' }}>${Number(stats.totalRevenue || 0).toLocaleString()}</h2>
                </div>
                <div className="card">
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>This Month Sales</p>
                    <h2>${Number(stats.monthlySales || 0).toLocaleString()}</h2>
                </div>
                <div className="card">
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Platform Commission (5%)</p>
                    <h2>${Number(stats.platformCommission || 0).toLocaleString()}</h2>
                </div>
                <div className="card">
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Churn Rate</p>
                    <h2 style={{ color: stats.churnRate > 5 ? 'var(--danger)' : 'var(--success)' }}>{stats.churnRate || 0}%</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.25rem' }}>This month</p>
                </div>
            </div>

            {/* Revenue per Plan + Trends */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                {/* Revenue per Plan */}
                <div className="card">
                    <h3 style={{ marginBottom: '1rem' }}>Revenue per Plan</h3>
                    {stats.planRevenue && stats.planRevenue.length > 0 ? (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
                                    <th style={{ padding: '0.5rem' }}>Plan</th>
                                    <th style={{ padding: '0.5rem' }}>Subscribers</th>
                                    <th style={{ padding: '0.5rem' }}>Monthly Rev</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.planRevenue.map((p, i) => (
                                    <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                                        <td style={{ padding: '0.5rem', fontWeight: '500' }}>{p.plan_name}</td>
                                        <td style={{ padding: '0.5rem' }}>{p.subscriber_count}</td>
                                        <td style={{ padding: '0.5rem', color: 'var(--primary)', fontWeight: '600' }}>${Number(p.monthly_revenue || 0).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p style={{ color: 'var(--text-muted)' }}>No active subscriptions yet.</p>
                    )}
                </div>

                {/* Monthly Revenue Trend */}
                <div className="card">
                    <h3 style={{ marginBottom: '1rem' }}>Monthly Revenue Trend (6 mo)</h3>
                    {stats.monthlyTrend && stats.monthlyTrend.length > 0 ? (
                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem', height: '150px', paddingTop: '1rem' }}>
                            {stats.monthlyTrend.map((m, i) => (
                                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                                    <span style={{ fontSize: '0.7rem', marginBottom: '0.25rem', color: 'var(--text-muted)' }}>${Number(m.revenue || 0).toLocaleString()}</span>
                                    <div style={{
                                        width: '100%',
                                        height: `${Math.max((m.revenue / maxRevenue) * 100, 5)}%`,
                                        backgroundColor: 'var(--primary)',
                                        borderRadius: '4px 4px 0 0',
                                        transition: 'height 0.3s'
                                    }}></div>
                                    <span style={{ fontSize: '0.7rem', marginTop: '0.25rem', color: 'var(--text-muted)' }}>{m.month}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p style={{ color: 'var(--text-muted)' }}>No data yet.</p>
                    )}
                </div>
            </div>

            {/* Tenant Growth Trend */}
            <div className="card">
                <h3 style={{ marginBottom: '1rem' }}>Tenant Growth (6 mo)</h3>
                {stats.tenantTrend && stats.tenantTrend.length > 0 ? (
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem', height: '120px', paddingTop: '1rem' }}>
                        {stats.tenantTrend.map((m, i) => (
                            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                                <span style={{ fontSize: '0.7rem', marginBottom: '0.25rem', color: 'var(--text-muted)' }}>{m.new_tenants}</span>
                                <div style={{
                                    width: '100%',
                                    height: `${Math.max((m.new_tenants / maxTenants) * 100, 5)}%`,
                                    backgroundColor: 'var(--success)',
                                    borderRadius: '4px 4px 0 0',
                                    transition: 'height 0.3s'
                                }}></div>
                                <span style={{ fontSize: '0.7rem', marginTop: '0.25rem', color: 'var(--text-muted)' }}>{m.month}</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p style={{ color: 'var(--text-muted)' }}>No data yet.</p>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;
