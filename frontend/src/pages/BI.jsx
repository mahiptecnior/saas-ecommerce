import React, { useState, useEffect } from 'react';
import api from '../api/axios';

const BI = () => {
    const [health, setHealth] = useState(null);
    const [loading, setLoading] = useState(true);
    const [reports, setReports] = useState([]);
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportForm, setReportForm] = useState({ report_type: 'sales_summary', frequency: 'weekly', recipient_emails: '' });

    useEffect(() => {
        fetchBI();
        fetchReports();
    }, []);

    const fetchBI = async () => {
        try {
            const res = await api.get('/bi/health');
            setHealth(res.data.data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const fetchReports = async () => {
        try {
            const res = await api.get('/bi/reports');
            setReports(res.data.data);
        } catch (err) { console.error(err); }
    };

    const handleScheduleReport = async (e) => {
        e.preventDefault();
        try {
            await api.post('/bi/reports', reportForm);
            alert('Report scheduled!');
            setShowReportModal(false);
            fetchReports();
        } catch (err) { alert('Error scheduling report'); }
    };

    if (loading) return <div className="fade-in">Loading BI Analytics...</div>;

    return (
        <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1>Business Intelligence</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Advanced analytics and performance tracking for your store.</p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="btn btn-outline" onClick={() => window.print()}>🖨️ Export PDF</button>
                    <button className="btn btn-primary" onClick={() => setShowReportModal(true)}>📅 Schedule Report</button>
                </div>
            </div>

            {/* Metrics Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
                <div className="card" style={{ borderTop: '4px solid var(--primary)' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.5rem' }}>TOTAL REVENUE</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: '800' }}>${health?.totalRevenue?.toLocaleString()}</div>
                </div>
                <div className="card" style={{ borderTop: '4px solid var(--danger)' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.5rem' }}>TOTAL EXPENSES</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: '800' }}>${health?.totalExpenses?.toLocaleString()}</div>
                </div>
                <div className="card" style={{ borderTop: '4px solid var(--success)' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.5rem' }}>NET PROFIT</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--success)' }}>${health?.netProfit?.toLocaleString()}</div>
                </div>
                <div className="card" style={{ borderTop: '4px solid #8b5cf6' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.5rem' }}>AVG. LTV</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: '800' }}>${health?.avgLTV?.toFixed(2)}</div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem' }}>
                <div className="card">
                    <h3>Revenue vs Expenses (Trend)</h3>
                    <div style={{ height: '300px', backgroundColor: 'var(--background)', borderRadius: '8px', marginTop: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                        [ Visualization Placeholder: Interactive Charts would go here ]
                    </div>
                </div>

                <div className="card">
                    <h3>Customer Health</h3>
                    <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                        <div style={{ fontSize: '3rem', fontWeight: '900', color: parseFloat(health?.churnRate) > 10 ? 'var(--danger)' : 'var(--success)' }}>
                            {health?.churnRate}
                        </div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Estimated Churn Rate (60 days)</div>

                        <div style={{ marginTop: '2.5rem', textAlign: 'left' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                <span>Retention Score</span>
                                <span style={{ fontWeight: 'bold' }}>Good</span>
                            </div>
                            <div style={{ backgroundColor: 'var(--border)', height: '8px', borderRadius: '4px' }}>
                                <div style={{ backgroundColor: 'var(--success)', width: '85%', height: '100%', borderRadius: '4px' }}></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Scheduled Reports List */}
            {reports.length > 0 && (
                <div className="card" style={{ marginTop: '2rem' }}>
                    <h3>Scheduled Email Reports</h3>
                    <table className="table" style={{ marginTop: '1rem' }}>
                        <thead>
                            <tr><th>Report Type</th><th>Frequency</th><th>Recipients</th><th>Status</th></tr>
                        </thead>
                        <tbody>
                            {reports.map(r => (
                                <tr key={r.id}>
                                    <td style={{ fontWeight: '600' }}>{r.report_type.replace('_', ' ').toUpperCase()}</td>
                                    <td>{r.frequency}</td>
                                    <td>{r.recipient_emails}</td>
                                    <td><span className="badge badge-success">{r.status}</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Report Modal */}
            {showReportModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                    <div className="card" style={{ width: '450px' }}>
                        <h3>Schedule performance Report</h3>
                        <form onSubmit={handleScheduleReport} style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div className="form-group">
                                <label>Report Type</label>
                                <select className="form-control" value={reportForm.report_type} onChange={e => setReportForm({ ...reportForm, report_type: e.target.value })}>
                                    <option value="sales_summary">Sales & Revenue Summary</option>
                                    <option value="inventory_alert">Inventory & Stock Alerts</option>
                                    <option value="financial_health">Financial Health (P&L)</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Frequency</label>
                                <select className="form-control" value={reportForm.frequency} onChange={e => setReportForm({ ...reportForm, frequency: e.target.value })}>
                                    <option value="daily">Daily</option>
                                    <option value="weekly">Weekly</option>
                                    <option value="monthly">Monthly</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Recipient Emails (comma separated)</label>
                                <input type="text" className="form-control" placeholder="admin@example.com, ceo@example.com" value={reportForm.recipient_emails} onChange={e => setReportForm({ ...reportForm, recipient_emails: e.target.value })} required />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                                <button type="button" className="btn" onClick={() => setShowReportModal(false)} style={{ flex: 1 }}>Cancel</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Schedule Now</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BI;
