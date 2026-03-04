import React, { useState, useEffect } from 'react';
import api from '../api/axios';

const AuditLogs = () => {
    const [logs, setLogs] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
    const [filters, setFilters] = useState({ action: '', tenant_id: '', start_date: '', end_date: '' });
    const [loading, setLoading] = useState(true);

    const fetchLogs = async (page = 1) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page, limit: 20 });
            if (filters.action) params.append('action', filters.action);
            if (filters.tenant_id) params.append('tenant_id', filters.tenant_id);
            if (filters.start_date) params.append('start_date', filters.start_date);
            if (filters.end_date) params.append('end_date', filters.end_date);

            const { data } = await api.get(`/admin/audit-logs?${params.toString()}`);
            setLogs(data.data);
            setPagination(data.pagination);
        } catch (err) {
            console.error('Error fetching audit logs:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchLogs(); }, []);

    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    const applyFilters = (e) => {
        e.preventDefault();
        fetchLogs(1);
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2>Audit Logs</h2>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{pagination.total} total entries</span>
            </div>

            {/* Filters */}
            <form onSubmit={applyFilters} className="card" style={{ padding: '1rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.3rem', color: 'var(--text-muted)' }}>Action</label>
                    <input className="input-field" name="action" value={filters.action} onChange={handleFilterChange} placeholder="e.g. LOGIN" style={{ width: '150px' }} />
                </div>
                <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.3rem', color: 'var(--text-muted)' }}>Tenant ID</label>
                    <input className="input-field" name="tenant_id" value={filters.tenant_id} onChange={handleFilterChange} placeholder="ID" style={{ width: '80px' }} />
                </div>
                <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.3rem', color: 'var(--text-muted)' }}>From Date</label>
                    <input className="input-field" type="date" name="start_date" value={filters.start_date} onChange={handleFilterChange} />
                </div>
                <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.3rem', color: 'var(--text-muted)' }}>To Date</label>
                    <input className="input-field" type="date" name="end_date" value={filters.end_date} onChange={handleFilterChange} />
                </div>
                <button type="submit" className="btn btn-primary" style={{ height: 'fit-content' }}>Filter</button>
            </form>

            {/* Table */}
            <div className="card" style={{ overflow: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
                            <th style={{ padding: '0.75rem' }}>Date</th>
                            <th style={{ padding: '0.75rem' }}>Tenant</th>
                            <th style={{ padding: '0.75rem' }}>Action</th>
                            <th style={{ padding: '0.75rem' }}>Details</th>
                            <th style={{ padding: '0.75rem' }}>IP Address</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</td></tr>
                        ) : logs.length === 0 ? (
                            <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No audit logs found.</td></tr>
                        ) : logs.map(log => (
                            <tr key={log.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                <td style={{ padding: '0.75rem', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                                    {new Date(log.created_at).toLocaleString()}
                                </td>
                                <td style={{ padding: '0.75rem' }}>
                                    {log.tenant_name || <span style={{ color: 'var(--text-muted)' }}>Platform</span>}
                                </td>
                                <td style={{ padding: '0.75rem' }}>
                                    <span style={{ backgroundColor: 'var(--primary)', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>
                                        {log.action}
                                    </span>
                                </td>
                                <td style={{ padding: '0.75rem', fontSize: '0.85rem', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {log.details}
                                </td>
                                <td style={{ padding: '0.75rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                    {log.ip_address || '—'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
                    {Array.from({ length: pagination.totalPages }, (_, i) => (
                        <button
                            key={i + 1}
                            className={`btn ${pagination.page === i + 1 ? 'btn-primary' : 'btn-outline'}`}
                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                            onClick={() => fetchLogs(i + 1)}
                        >
                            {i + 1}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AuditLogs;
