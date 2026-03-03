import React, { useState, useEffect } from 'react';
import api from '../api/axios';

const Tenants = () => {
    const [tenants, setTenants] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);

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
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tenants.map(t => (
                            <tr key={t.id}>
                                <td>
                                    <strong>{t.name}</strong>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t.business_name || 'N/A'}</div>
                                </td>
                                <td style={{ fontFamily: 'monospace', color: 'var(--primary)' }}>{t.subdomain || t.domain}</td>
                                <td>
                                    <div>{t.owner_name || 'N/A'}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t.owner_email || 'N/A'}</div>
                                </td>
                                <td><span className={`badge badge-${t.status}`}>{t.status}</span></td>
                                <td>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button onClick={() => openEditModal(t)} className="btn btn-outline" style={{ padding: '4px 12px', fontSize: '12px' }}>Edit</button>
                                        <button onClick={() => handleDelete(t.id)} className="btn btn-danger" style={{ padding: '4px 12px', fontSize: '12px' }}>Delete</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {tenants.length === 0 && (
                            <tr>
                                <td colSpan="5" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
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
