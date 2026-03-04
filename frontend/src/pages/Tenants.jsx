import React, { useState, useEffect } from 'react';
import api from '../api/axios';

const UsageBar = ({ label, used, limit }) => {
    const pct = limit === -1 ? 0 : limit === 0 ? 100 : Math.min((used / limit) * 100, 100);
    const color = pct >= 90 ? 'var(--danger)' : pct >= 70 ? '#f39c12' : 'var(--success)';
    return (
        <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>{label}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ flex: 1, height: '6px', backgroundColor: 'var(--border)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', backgroundColor: color, borderRadius: '3px', transition: 'width 0.3s' }}></div>
                </div>
                <span style={{ fontSize: '0.8rem', fontWeight: '500' }}>{used} / {limit === -1 ? '∞' : limit}</span>
            </div>
        </div>
    );
};

const Tenants = () => {
    const [tenants, setTenants] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [usageOpen, setUsageOpen] = useState(null);
    const [usageData, setUsageData] = useState(null);

    // Form state
    const [id, setId] = useState(null);
    const [name, setName] = useState('');
    const [subdomain, setSubdomain] = useState('');
    const [status, setStatus] = useState('pending');
    const [businessName, setBusinessName] = useState('');
    const [businessAddress, setBusinessAddress] = useState('');
    const [businessTaxId, setBusinessTaxId] = useState('');
    const [ownerName, setOwnerName] = useState('');
    const [ownerEmail, setOwnerEmail] = useState('');
    const [ownerPhone, setOwnerPhone] = useState('');
    const [password, setPassword] = useState('');

    useEffect(() => {
        fetchTenants();
    }, []);

    const fetchTenants = async () => {
        try {
            const { data } = await api.get('/admin/tenants');
            setTenants(data.data);
        } catch (err) {
            console.error('Error fetching tenants', err);
        }
    };

    const handleApprove = async (tenantId) => {
        try {
            await api.patch(`/admin/tenants/${tenantId}/approve`);
            fetchTenants();
        } catch (err) { alert('Error approving tenant'); }
    };

    const handleReject = async (tenantId) => {
        const reason = prompt('Rejection reason (optional):');
        try {
            await api.patch(`/admin/tenants/${tenantId}/reject`, { reason });
            fetchTenants();
        } catch (err) { alert('Error rejecting tenant'); }
    };

    const toggleUsage = async (tenantId) => {
        if (usageOpen === tenantId) { setUsageOpen(null); setUsageData(null); return; }
        try {
            const { data } = await api.get(`/admin/tenants/${tenantId}/usage`);
            setUsageData(data.data);
            setUsageOpen(tenantId);
        } catch (err) { console.error('Error fetching usage', err); }
    };

    const handleDomain = async (tenantId, status) => {
        try {
            await api.patch(`/admin/tenants/${tenantId}/domain`, { domain_status: status });
            fetchTenants();
        } catch (err) { alert('Error updating domain'); }
    };

    const openCreateModal = () => {
        setEditMode(false);
        setId(null);
        setName('');
        setSubdomain('');
        setStatus('pending');
        setBusinessName('');
        setBusinessAddress('');
        setBusinessTaxId('');
        setOwnerName('');
        setOwnerEmail('');
        setOwnerPhone('');
        setPassword('');
        setIsModalOpen(true);
    };

    const openEditModal = (tenant) => {
        setEditMode(true);
        setId(tenant.id);
        setName(tenant.name);
        setSubdomain(tenant.subdomain || '');
        setStatus(tenant.status || 'pending');
        setBusinessName(tenant.business_name || '');
        setBusinessAddress(tenant.business_address || '');
        setBusinessTaxId(tenant.business_tax_id || '');
        setOwnerName(tenant.owner_name || '');
        setOwnerEmail(tenant.owner_email || '');
        setOwnerPhone(tenant.owner_phone || '');
        setPassword(''); // Password cannot be edited from this endpoint right now
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const payload = {
            name, subdomain, status,
            business_name: businessName,
            business_address: businessAddress,
            business_tax_id: businessTaxId,
            owner_name: ownerName,
            owner_email: ownerEmail,
            owner_phone: ownerPhone,
        };

        try {
            if (editMode) {
                await api.put(`/admin/tenants/${id}`, payload);
            } else {
                payload.password = password; // Only needed for creation
                await api.post('/admin/tenants', payload);
            }
            closeModal();
            fetchTenants();
        } catch (err) {
            alert(editMode ? 'Error updating tenant' : 'Error creating tenant');
        }
    };

    const handleDelete = async (tenantId) => {
        if (window.confirm('Are you sure you want to delete this tenant completely?')) {
            try {
                await api.delete(`/admin/tenants/${tenantId}`);
                fetchTenants();
            } catch (err) {
                alert('Error deleting tenant');
            }
        }
    };

    return (
        <div className="animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h2>Tenant Management</h2>
                    <p className="text-muted">Manage all stores on the SaaS platform.</p>
                </div>
                <button onClick={openCreateModal} className="btn btn-primary">+ Create New Tenant</button>
            </div>

            <div className="card">
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr>
                            <th>Store Name</th>
                            <th>Subdomain</th>
                            <th>Owner</th>
                            <th>Plan</th>
                            <th>Approval</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tenants.map(t => (
                            <React.Fragment key={t.id}>
                                <tr>
                                    <td>
                                        <strong>{t.name}</strong>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t.business_name || 'N/A'}</div>
                                    </td>
                                    <td style={{ fontFamily: 'monospace', color: 'var(--primary)' }}>
                                        {t.subdomain || t.domain}
                                        {t.custom_domain && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>🌐 {t.custom_domain} ({t.domain_status})</div>}
                                    </td>
                                    <td>
                                        <div>{t.owner_name || 'N/A'}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t.owner_email || 'N/A'}</div>
                                    </td>
                                    <td>
                                        <span style={{ fontWeight: '500', color: t.current_plan_name ? 'var(--primary)' : 'var(--text-muted)' }}>
                                            {t.current_plan_name || 'No Plan'}
                                        </span>
                                        {t.end_date && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Exp: {new Date(t.end_date).toLocaleDateString()}</div>}
                                    </td>
                                    <td>
                                        <span className={`badge badge-${t.approval_status === 'approved' ? 'active' : t.approval_status === 'rejected' ? 'suspended' : 'pending'}`}>
                                            {t.approval_status || 'approved'}
                                        </span>
                                    </td>
                                    <td><span className={`badge badge-${t.status}`}>{t.status}</span></td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                                            {t.approval_status === 'pending' && (
                                                <>
                                                    <button onClick={() => handleApprove(t.id)} className="btn" style={{ padding: '3px 8px', fontSize: '11px', background: 'var(--success)', color: '#fff', border: 'none', borderRadius: '4px' }}>Approve</button>
                                                    <button onClick={() => handleReject(t.id)} className="btn" style={{ padding: '3px 8px', fontSize: '11px', background: 'var(--danger)', color: '#fff', border: 'none', borderRadius: '4px' }}>Reject</button>
                                                </>
                                            )}
                                            <button onClick={() => toggleUsage(t.id)} className="btn btn-outline" style={{ padding: '3px 8px', fontSize: '11px' }}>Usage</button>
                                            <button onClick={() => openEditModal(t)} className="btn btn-outline" style={{ padding: '3px 8px', fontSize: '11px' }}>Edit</button>
                                            <button onClick={() => handleDelete(t.id)} className="btn btn-danger" style={{ padding: '3px 8px', fontSize: '11px' }}>Delete</button>
                                            {t.domain_status === 'pending' && (
                                                <>
                                                    <button onClick={() => handleDomain(t.id, 'approved')} className="btn" style={{ padding: '3px 8px', fontSize: '11px', background: '#2196F3', color: '#fff', border: 'none', borderRadius: '4px' }}>✓ Domain</button>
                                                    <button onClick={() => handleDomain(t.id, 'rejected')} className="btn" style={{ padding: '3px 8px', fontSize: '11px', background: '#999', color: '#fff', border: 'none', borderRadius: '4px' }}>✗ Domain</button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                                {usageOpen === t.id && usageData && (
                                    <tr>
                                        <td colSpan="7" style={{ background: 'var(--bg-secondary)', padding: '1rem' }}>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                                                <UsageBar label="Products" used={usageData.products.used} limit={usageData.products.limit} />
                                                <UsageBar label="Orders" used={usageData.orders.used} limit={usageData.orders.limit} />
                                                <UsageBar label="Staff" used={usageData.staff.used} limit={usageData.staff.limit} />
                                                <div>
                                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Active Modules</div>
                                                    <strong>{usageData.modules_active}</strong>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                        {tenants.length === 0 && (
                            <tr>
                                <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                                    No tenants found. Create one to get started.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
                    <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3>{editMode ? 'Edit Tenant' : 'Create New Tenant'}</h3>
                            <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem', color: 'var(--text-muted)' }}>&times;</button>
                        </div>
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            {/* Platform Details */}
                            <div>
                                <h4 style={{ fontSize: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1rem', color: 'var(--primary)' }}>Platform Settings</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: '500' }}>Store Name</label>
                                        <input className="input-field" value={name} onChange={(e) => setName(e.target.value)} required />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: '500' }}>Subdomain</label>
                                        <input className="input-field" value={subdomain} onChange={(e) => setSubdomain(e.target.value)} required />
                                    </div>
                                    {editMode && (
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: '500' }}>Status</label>
                                            <select className="input-field" value={status} onChange={(e) => setStatus(e.target.value)}>
                                                <option value="pending">Pending</option>
                                                <option value="active">Active</option>
                                                <option value="suspended">Suspended</option>
                                            </select>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Business Details */}
                            <div>
                                <h4 style={{ fontSize: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1rem', color: 'var(--primary)' }}>Business Information</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: '500' }}>Legal Business Name</label>
                                        <input className="input-field" value={businessName} onChange={(e) => setBusinessName(e.target.value)} required />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: '500' }}>Tax ID / EIN</label>
                                        <input className="input-field" value={businessTaxId} onChange={(e) => setBusinessTaxId(e.target.value)} required />
                                    </div>
                                    <div style={{ gridColumn: 'span 2' }}>
                                        <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: '500' }}>Business Address</label>
                                        <input className="input-field" value={businessAddress} onChange={(e) => setBusinessAddress(e.target.value)} required />
                                    </div>
                                </div>
                            </div>

                            {/* Owner Details */}
                            <div>
                                <h4 style={{ fontSize: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1rem', color: 'var(--primary)' }}>Store Owner</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: '500' }}>Owner Full Name</label>
                                        <input className="input-field" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} required />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: '500' }}>Owner Email</label>
                                        <input className="input-field" type="email" value={ownerEmail} onChange={(e) => setOwnerEmail(e.target.value)} required />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: '500' }}>Owner Phone</label>
                                        <input className="input-field" value={ownerPhone} onChange={(e) => setOwnerPhone(e.target.value)} required />
                                    </div>
                                    {!editMode && (
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: '500' }}>Initial Password</label>
                                            <input className="input-field" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                                <button type="button" className="btn btn-outline" onClick={closeModal}>Cancel</button>
                                <button type="submit" className="btn btn-primary">{editMode ? 'Save Changes' : 'Create Tenant & Owner'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Tenants;
