import React, { useState, useEffect } from 'react';
import api from '../api/axios';

const AdminSecurity = () => {
    const [activeSection, setActiveSection] = useState('backup');
    const [backups, setBackups] = useState([]);
    const [ipList, setIpList] = useState([]);
    const [newIp, setNewIp] = useState('');
    const [ipDesc, setIpDesc] = useState('');
    const [twoFARequired, setTwoFARequired] = useState(false);
    const [exportTenantId, setExportTenantId] = useState('');
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState('');

    useEffect(() => { fetchBackups(); fetchIpList(); fetch2FAStatus(); }, []);

    const fetchBackups = async () => {
        try { const { data } = await api.get('/admin/backups'); setBackups(data.data); } catch (err) { console.error(err); }
    };
    const fetchIpList = async () => {
        try { const { data } = await api.get('/admin/ip-whitelist'); setIpList(data.data); } catch (err) { console.error(err); }
    };
    const fetch2FAStatus = async () => {
        try { const { data } = await api.get('/admin/2fa-status'); setTwoFARequired(data.data.two_factor_required); } catch (err) { console.error(err); }
    };

    const createBackup = async () => {
        setLoading(true); setMsg('');
        try {
            const { data } = await api.post('/admin/backup');
            setMsg(`Backup created: ${data.data.filename}`);
            fetchBackups();
        } catch (err) { setMsg('Backup failed'); }
        finally { setLoading(false); }
    };

    const addIp = async () => {
        if (!newIp) return;
        try {
            await api.post('/admin/ip-whitelist', { ip_address: newIp, description: ipDesc });
            setNewIp(''); setIpDesc('');
            fetchIpList();
        } catch (err) { alert(err.response?.data?.message || 'Error'); }
    };

    const removeIp = async (id) => {
        try { await api.delete(`/admin/ip-whitelist/${id}`); fetchIpList(); } catch (err) { alert('Error'); }
    };

    const toggle2FA = async () => {
        try {
            await api.post('/admin/2fa-toggle', { enabled: !twoFARequired });
            setTwoFARequired(!twoFARequired);
        } catch (err) { alert('Error'); }
    };

    const exportData = async () => {
        if (!exportTenantId) return alert('Enter a tenant ID');
        try {
            const res = await api.get(`/admin/tenants/${exportTenantId}/export`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([JSON.stringify(res.data)]));
            const a = document.createElement('a');
            a.href = url; a.download = `tenant-${exportTenantId}-export.json`;
            a.click();
        } catch (err) { alert('Error exporting data'); }
    };

    const deleteData = async () => {
        if (!exportTenantId) return alert('Enter a tenant ID');
        if (!confirm(`⚠️ This will PERMANENTLY DELETE all data for tenant ${exportTenantId}. This cannot be undone. Proceed?`)) return;
        try {
            await api.delete(`/admin/tenants/${exportTenantId}/data`);
            alert('Tenant data deleted');
        } catch (err) { alert('Error deleting data'); }
    };

    const sectionStyle = (s) => ({
        padding: '0.6rem 1.2rem',
        cursor: 'pointer',
        background: activeSection === s ? 'var(--primary)' : 'transparent',
        color: activeSection === s ? '#fff' : 'var(--text)',
        border: '1px solid var(--border)',
        borderRadius: '6px',
        fontSize: '0.85rem',
        fontWeight: '500'
    });

    return (
        <div className="fade-in">
            <h2>Security & Compliance</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Backups, IP whitelisting, 2FA, and GDPR compliance tools.</p>

            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                <button style={sectionStyle('backup')} onClick={() => setActiveSection('backup')}>💾 Backups</button>
                <button style={sectionStyle('ip')} onClick={() => setActiveSection('ip')}>🔒 IP Whitelist</button>
                <button style={sectionStyle('2fa')} onClick={() => setActiveSection('2fa')}>🔑 2FA</button>
                <button style={sectionStyle('gdpr')} onClick={() => setActiveSection('gdpr')}>📋 GDPR</button>
            </div>

            {msg && <div style={{ padding: '0.75rem', background: 'var(--success)', color: '#fff', borderRadius: '6px', marginBottom: '1rem' }}>{msg}</div>}

            {/* BACKUPS */}
            {activeSection === 'backup' && (
                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3>Database Backups</h3>
                        <button onClick={createBackup} className="btn btn-primary" disabled={loading}>{loading ? 'Creating...' : '+ Create Backup'}</button>
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead><tr><th style={{ textAlign: 'left', padding: '0.5rem' }}>Filename</th><th style={{ padding: '0.5rem' }}>Size</th><th style={{ padding: '0.5rem' }}>Created</th></tr></thead>
                        <tbody>
                            {backups.map((b, i) => (
                                <tr key={i} style={{ borderTop: '1px solid var(--border)' }}>
                                    <td style={{ padding: '0.5rem', fontFamily: 'monospace', fontSize: '0.85rem' }}>{b.filename}</td>
                                    <td style={{ padding: '0.5rem', textAlign: 'center' }}>{(b.size / 1024).toFixed(1)} KB</td>
                                    <td style={{ padding: '0.5rem', textAlign: 'center', fontSize: '0.85rem' }}>{new Date(b.created_at).toLocaleString()}</td>
                                </tr>
                            ))}
                            {backups.length === 0 && <tr><td colSpan="3" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No backups yet.</td></tr>}
                        </tbody>
                    </table>
                </div>
            )}

            {/* IP WHITELIST */}
            {activeSection === 'ip' && (
                <div className="card">
                    <h3 style={{ marginBottom: '1rem' }}>IP Whitelist</h3>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                        <input className="input-field" placeholder="IP Address" value={newIp} onChange={e => setNewIp(e.target.value)} style={{ flex: 1 }} />
                        <input className="input-field" placeholder="Description" value={ipDesc} onChange={e => setIpDesc(e.target.value)} style={{ flex: 1 }} />
                        <button onClick={addIp} className="btn btn-primary" style={{ whiteSpace: 'nowrap' }}>+ Add</button>
                    </div>
                    {ipList.map(ip => (
                        <div key={ip.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', borderBottom: '1px solid var(--border)' }}>
                            <div><code>{ip.ip_address}</code> <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>— {ip.description || 'No description'}</span></div>
                            <button onClick={() => removeIp(ip.id)} className="btn btn-danger" style={{ padding: '2px 8px', fontSize: '11px' }}>Remove</button>
                        </div>
                    ))}
                    {ipList.length === 0 && <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>No IPs whitelisted.</p>}
                </div>
            )}

            {/* 2FA */}
            {activeSection === '2fa' && (
                <div className="card">
                    <h3 style={{ marginBottom: '1rem' }}>Two-Factor Authentication</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                            <input type="checkbox" checked={twoFARequired} onChange={toggle2FA} />
                            <strong>Require 2FA for all admin users</strong>
                        </label>
                    </div>
                    <p style={{ color: 'var(--text-muted)', marginTop: '0.75rem', fontSize: '0.85rem' }}>
                        When enabled, all admin and tenant owners will be required to set up TOTP-based 2FA on their next login.
                    </p>
                </div>
            )}

            {/* GDPR */}
            {activeSection === 'gdpr' && (
                <div className="card">
                    <h3 style={{ marginBottom: '1rem' }}>GDPR / Data Compliance</h3>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', alignItems: 'flex-end' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.3rem' }}>Tenant ID</label>
                            <input className="input-field" type="number" value={exportTenantId} onChange={e => setExportTenantId(e.target.value)} placeholder="Enter tenant ID" />
                        </div>
                        <button onClick={exportData} className="btn btn-primary" style={{ whiteSpace: 'nowrap' }}>📥 Export Data</button>
                        <button onClick={deleteData} className="btn btn-danger" style={{ whiteSpace: 'nowrap' }}>🗑️ Delete Data</button>
                    </div>
                    <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        <strong>Export:</strong> Downloads all tenant data (users, orders, products, subscriptions) as a JSON file.<br />
                        <strong>Delete:</strong> Permanently removes all tenant data. This action cannot be undone.
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminSecurity;
