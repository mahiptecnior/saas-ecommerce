import React, { useState, useEffect } from 'react';
import api from '../api/axios';

// Available modules a tenant can manage permissions for
const AVAILABLE_MODULES = [
    { id: 'products', name: 'Products & Catalog' },
    { id: 'orders', name: 'Sales & Orders' },
    { id: 'marketing', name: 'Marketing & Campaigns' },
    { id: 'accounts', name: 'Accounts & Expenses' },
    { id: 'support', name: 'Support Tickets' },
    { id: 'settings', name: 'Store Settings' }
];

const Roles = () => {
    const [roles, setRoles] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [loading, setLoading] = useState(true);

    // Form state
    const [form, setForm] = useState({ id: null, name: '', description: '', permissions: [] });

    useEffect(() => { fetchRoles(); }, []);

    const fetchRoles = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/tenant-admin/roles');
            setRoles(data.data);
        } catch (error) {
            console.error('Error fetching roles', error);
        } finally {
            setLoading(false);
        }
    };

    const openCreate = () => {
        setEditMode(false);
        setForm({
            id: null, name: '', description: '',
            permissions: AVAILABLE_MODULES.map(m => ({ module_name: m.id, can_read: false, can_write: false, can_delete: false }))
        });
        setIsModalOpen(true);
    };

    const openEdit = (role) => {
        setEditMode(true);
        // Map existing permissions, filling in blanks for modules that don't have records yet
        const mappedPerms = AVAILABLE_MODULES.map(m => {
            const existing = role.permissions?.find(p => p.module_name === m.id);
            return existing ? { ...existing } : { module_name: m.id, can_read: false, can_write: false, can_delete: false };
        });
        setForm({ id: role.id, name: role.name, description: role.description, permissions: mappedPerms });
        setIsModalOpen(true);
    };

    const handlePermissionChange = (moduleName, type, value) => {
        setForm(prev => ({
            ...prev,
            permissions: prev.permissions.map(p =>
                p.module_name === moduleName ? { ...p, [type]: value } : p
            )
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editMode) {
                await api.put(`/tenant-admin/roles/${form.id}`, form);
            } else {
                await api.post('/tenant-admin/roles', form);
            }
            setIsModalOpen(false);
            fetchRoles();
        } catch (error) {
            alert(error.response?.data?.message || 'Error saving role');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this role? Users assigned to this role will become unassigned.')) return;
        try {
            await api.delete(`/tenant-admin/roles/${id}`);
            fetchRoles();
        } catch (error) {
            alert(error.response?.data?.message || 'Error deleting role');
        }
    };

    return (
        <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                    <h2>Role Management</h2>
                    <p style={{ color: 'var(--text-muted)' }}>Define granular access control for your store staff.</p>
                </div>
                <button onClick={openCreate} className="btn btn-primary">+ Create Custom Role</button>
            </div>

            <div className="card" style={{ overflow: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
                            <th style={{ padding: '0.75rem' }}>Role Name</th>
                            <th style={{ padding: '0.75rem' }}>Description</th>
                            <th style={{ padding: '0.75rem' }}>Type</th>
                            <th style={{ padding: '0.75rem' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="4" style={{ padding: '2rem', textAlign: 'center' }}>Loading...</td></tr>
                        ) : roles.map(role => (
                            <tr key={role.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                <td style={{ padding: '0.75rem', fontWeight: '500' }}>{role.name}</td>
                                <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>{role.description || '-'}</td>
                                <td style={{ padding: '0.75rem' }}>
                                    <span className={`badge badge-${role.is_system ? 'primary' : 'active'}`}>
                                        {role.is_system ? 'System default' : 'Custom'}
                                    </span>
                                </td>
                                <td style={{ padding: '0.75rem' }}>
                                    <button onClick={() => openEdit(role)} className="btn btn-outline" style={{ padding: '4px 10px', fontSize: '0.8rem', marginRight: '0.5rem' }}>Edit Permissions</button>
                                    {!role.is_system && (
                                        <button onClick={() => handleDelete(role.id)} className="btn btn-danger" style={{ padding: '4px 10px', fontSize: '0.8rem' }}>Delete</button>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {roles.length === 0 && !loading && (
                            <tr><td colSpan="4" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No roles defined. Create one!</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '2rem' }}>
                    <div className="card" style={{ width: '800px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                            <h3>{editMode ? 'Edit Role' : 'Create Custom Role'}</h3>
                            <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem' }}>&times;</button>
                        </div>
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.3rem' }}>Role Name *</label>
                                    <input className="input-field" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required disabled={form.is_system} placeholder="e.g. Content Writer" />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.3rem' }}>Description</label>
                                    <input className="input-field" value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} disabled={form.is_system} placeholder="What this role does..." />
                                </div>
                            </div>

                            <div>
                                <h4>Module Permissions</h4>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Assign granular access to different modules of your store.</p>

                                <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid var(--border)' }}>
                                    <thead style={{ backgroundColor: 'var(--background)' }}>
                                        <tr>
                                            <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>Module</th>
                                            <th style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '1px solid var(--border)' }}>Read</th>
                                            <th style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '1px solid var(--border)' }}>Write / Edit</th>
                                            <th style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '1px solid var(--border)' }}>Delete</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {AVAILABLE_MODULES.map(mod => {
                                            const perm = form.permissions.find(p => p.module_name === mod.id) || { can_read: false, can_write: false, can_delete: false };
                                            return (
                                                <tr key={mod.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                                    <td style={{ padding: '0.75rem', fontWeight: '500' }}>{mod.name}</td>
                                                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                                        <input type="checkbox" checked={!!perm.can_read} onChange={(e) => handlePermissionChange(mod.id, 'can_read', e.target.checked)} />
                                                    </td>
                                                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                                        <input type="checkbox" checked={!!perm.can_write} onChange={(e) => handlePermissionChange(mod.id, 'can_write', e.target.checked)} />
                                                    </td>
                                                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                                        <input type="checkbox" checked={!!perm.can_delete} onChange={(e) => handlePermissionChange(mod.id, 'can_delete', e.target.checked)} />
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem' }}>{editMode ? 'Save Changes' : 'Create Role'}</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Roles;
