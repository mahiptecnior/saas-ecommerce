import React, { useState, useEffect } from 'react';
import api from '../api/axios';

const AdminTransactions = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTransactions();
    }, []);

    const fetchTransactions = async () => {
        try {
            // Mocking the API response since we don't have a dedicated platform transactions table yet
            // Ideally this would be `api.get('/admin/transactions')` which joins subscriptions, payments, etc.
            setTimeout(() => {
                setTransactions([
                    { id: 'TXN-001', date: '2026-03-04T10:30:00Z', tenant: 'Acme Corp', type: 'Subscription - Pro', amount: 79.00, status: 'completed', method: 'Stripe' },
                    { id: 'TXN-002', date: '2026-03-03T15:45:00Z', tenant: 'TechNova', type: 'Subscription - Enterprise', amount: 199.00, status: 'completed', method: 'Stripe' },
                    { id: 'TXN-003', date: '2026-03-02T09:12:00Z', tenant: 'GlobalReach', type: 'Subscription - Basic', amount: 29.00, status: 'failed', method: 'PayPal' },
                    { id: 'TXN-004', date: '2026-03-01T14:20:00Z', tenant: 'MarketSpark', type: 'Subscription - Pro (Yearly)', amount: 790.00, status: 'completed', method: 'Stripe' },
                ]);
                setLoading(false);
            }, 800);
        } catch (error) {
            console.error('Error fetching transactions', error);
            setLoading(false);
        }
    };

    return (
        <div className="animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h2>Platform Transactions</h2>
                    <p className="text-muted">A comprehensive view of all subscription payments and platform revenue.</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <div className="card" style={{ padding: '0.75rem 1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', borderTop: '4px solid var(--primary)' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Revenue</span>
                        <span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>$1,097.00</span>
                    </div>
                </div>
            </div>

            <div className="card">
                {loading ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading transactions...</div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr>
                                <th>Transaction ID</th>
                                <th>Date</th>
                                <th>Tenant</th>
                                <th>Description</th>
                                <th>Method</th>
                                <th>Amount</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transactions.map(txn => (
                                <tr key={txn.id}>
                                    <td style={{ fontFamily: 'monospace', fontWeight: '500' }}>{txn.id}</td>
                                    <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{new Date(txn.date).toLocaleDateString()} {new Date(txn.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                                    <td style={{ fontWeight: '500' }}>{txn.tenant}</td>
                                    <td>{txn.type}</td>
                                    <td>
                                        <span style={{
                                            padding: '0.2rem 0.5rem',
                                            borderRadius: '4px',
                                            fontSize: '0.75rem',
                                            backgroundColor: txn.method === 'Stripe' ? '#eef2ff' : '#eff6ff',
                                            color: txn.method === 'Stripe' ? '#4338ca' : '#1d4ed8',
                                            fontWeight: '600'
                                        }}>
                                            {txn.method}
                                        </span>
                                    </td>
                                    <td style={{ fontWeight: '600' }}>${txn.amount.toFixed(2)}</td>
                                    <td>
                                        <span className={`badge ${txn.status === 'completed' ? 'badge-active' : 'badge-suspended'}`}>
                                            {txn.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {transactions.length === 0 && !loading && (
                                <tr>
                                    <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                                        No transactions found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default AdminTransactions;
