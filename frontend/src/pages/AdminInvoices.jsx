import React, { useState, useEffect } from 'react';
import api from '../api/axios';

const AdminInvoices = () => {
    const [invoices, setInvoices] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
    const [loading, setLoading] = useState(true);

    const fetchInvoices = async (page = 1) => {
        setLoading(true);
        try {
            const { data } = await api.get(`/admin/invoices?page=${page}&limit=20`);
            setInvoices(data.data);
            setPagination(data.pagination);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchInvoices(); }, []);

    return (
        <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                    <h2>Invoices</h2>
                    <p style={{ color: 'var(--text-muted)' }}>{pagination.total} total invoices</p>
                </div>
            </div>

            <div className="card" style={{ overflow: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
                            <th style={{ padding: '0.75rem' }}>Invoice #</th>
                            <th style={{ padding: '0.75rem' }}>Tenant</th>
                            <th style={{ padding: '0.75rem' }}>Amount</th>
                            <th style={{ padding: '0.75rem' }}>Tax</th>
                            <th style={{ padding: '0.75rem' }}>Total</th>
                            <th style={{ padding: '0.75rem' }}>Status</th>
                            <th style={{ padding: '0.75rem' }}>Date</th>
                            <th style={{ padding: '0.75rem' }}>PDF</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="8" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</td></tr>
                        ) : invoices.length === 0 ? (
                            <tr><td colSpan="8" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No invoices generated yet.</td></tr>
                        ) : invoices.map(inv => (
                            <tr key={inv.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                <td style={{ padding: '0.75rem', fontFamily: 'monospace', fontSize: '0.85rem' }}>{inv.invoice_number}</td>
                                <td style={{ padding: '0.75rem' }}>{inv.tenant_name || `ID: ${inv.tenant_id}`}</td>
                                <td style={{ padding: '0.75rem' }}>${Number(inv.amount).toFixed(2)}</td>
                                <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>${Number(inv.tax).toFixed(2)}</td>
                                <td style={{ padding: '0.75rem', fontWeight: '600', color: 'var(--primary)' }}>${Number(inv.total).toFixed(2)}</td>
                                <td style={{ padding: '0.75rem' }}>
                                    <span className={`badge badge-${inv.status === 'paid' ? 'active' : 'suspended'}`}>{inv.status}</span>
                                </td>
                                <td style={{ padding: '0.75rem', fontSize: '0.85rem' }}>{new Date(inv.created_at).toLocaleDateString()}</td>
                                <td style={{ padding: '0.75rem' }}>
                                    {inv.pdf_url ? (
                                        <a href={`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}${inv.pdf_url}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', textDecoration: 'none' }}>📄 Download</a>
                                    ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {pagination.totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
                    {Array.from({ length: pagination.totalPages }, (_, i) => (
                        <button key={i + 1} className={`btn ${pagination.page === i + 1 ? 'btn-primary' : 'btn-outline'}`} style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }} onClick={() => fetchInvoices(i + 1)}>{i + 1}</button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AdminInvoices;
