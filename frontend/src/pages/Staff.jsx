import React, { useState, useEffect } from 'react';
import api from '../api/axios';

const Staff = () => {
    const [staff, setStaff] = useState([]);
    const [roles, setRoles] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [loading, setLoading] = useState(true);

    // Form state
    const [form, setForm] = useState({ id: null, name: '', email: '', password: '', role_id: '' });

    useEffect(() => {
        fetchStaff();
        fetchRoles();
    }, []);

    const fetchStaff = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/tenant-admin/staff');
            setStaff(data.data);
        } catch (error) { console.error('Error fetching staff', error); }
        finally { setLoading(false); }
    };

    const fetchRoles = async () => {
        try {
            const { data } = await api.get('/tenant-admin/roles');
            setRoles(data.data);
        } catch (error) { console.error('Error fetching roles', error); }
    };

    const openCreate = () => {
        setEditMode(false);
        setForm({ id: null, name: '', email: '', password: '', role_id: '' });
        setIsModalOpen(true);
    };

    const openEdit = (member) => {
        setEditMode(true);
        setForm({ id: member.id, name: member.name, email: member.email, role_id: member.role_id || '' });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editMode) {
                await api.put(`/tenant-admin/staff/${form.id}`, { name: form.name, role_id: form.role_id });
            } else {
                await api.post('/tenant-admin/staff', form);
            }
            setIsModalOpen(false);
            fetchStaff();
        } catch (error) {
            alert(error.response?.data?.message || 'Error saving staff member');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to remove this staff member?')) return;
        try {
            await api.delete(`/tenant-admin/staff/${id}`);
            fetchStaff();
        } catch (error) {
            alert(error.response?.data?.message || 'Error deleting staff');
        }
    };

    return (
        <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                    <h2>Staff Management</h2>
                    <p style={{ color: 'var(--text-muted)' }}>Invite your team and assign them roles.</p>
                </div>
                <button onClick={openCreate} className="btn btn-primary">+ Invite Staff</button>
            </div>

            <div className="card" style={{ overflow: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
                            <th style={{ padding: '0.75rem' }}>Name</th>
                            <th style={{ padding: '0.75rem' }}>Email</th>
                            <th style={{ padding: '0.75rem' }}>Assigned Role</th>
                            <th style={{ padding: '0.75rem' }}>Joined</th>
                            <th style={{ padding: '0.75rem' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center' }}>Loading...</td></tr>
                        ) : staff.map(member => (
                            <tr key={member.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                <td style={{ padding: '0.75rem', fontWeight: '500' }}>{member.name}</td>
                                <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>{member.email}</td>
                                <td style={{ padding: '0.75rem' }}>
                                    {member.role_name ? (
                                        <span className="badge badge-primary">{member.role_name}</span>
                                    ) : (
                                        <span className="badge badge-suspended">Store Owner</span>
                                    )}
                                </td>
                                <td style={{ padding: '0.75rem', fontSize: '0.85rem' }}>{new Date(member.created_at).toLocaleDateString()}</td>
                                <td style={{ padding: '0.75rem' }}>
                                    <button onClick={() => openEdit(member)} className="btn btn-outline" style={{ padding: '4px 10px', fontSize: '0.8rem', marginRight: '0.5rem' }}>Edit Role</button>
                                    <button onClick={() => handleDelete(member.id)} className="btn btn-danger" style={{ padding: '4px 10px', fontSize: '0.8rem' }}>Remove</button>
                                </td>
                            </tr>
                        ))}
                        {staff.length === 0 && !loading && (
                            <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No staff members added.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '2rem' }}>
                    <div className="card" style={{ width: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                            <h3>{editMode ? 'Edit Staff Member' : 'Invite Staff Member'}</h3>
                            <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem' }}>&times;</button>
                        </div>
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.3rem' }}>Full Name *</label>
                                <input className="input-field" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="e.g. Jane Doe" />
                            </div>

                            {!editMode && (
                                <>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.3rem' }}>Email Address *</label>
                                        <input type="email" className="input-field" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required placeholder="jane@company.com" />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.3rem' }}>Temporary Password *</label>
                                        <input type="password" className="input-field" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required placeholder="••••••••" />
                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>The staff member will use this to log in.</p>
                                    </div>
                                </>
                            )}

                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.3rem' }}>Assign Role *</label>
                                <select className="input-field" value={form.role_id} onChange={e => setForm({ ...form, role_id: e.target.value })} required>
                                    <option value="" disabled>Select a role...</option>
                                    {roles.map(r => (
                                        <option key={r.id} value={r.id}>{r.name}</option>
                                    ))}
                                </select>
                            </div>

                            <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem' }}>{editMode ? 'Save Changes' : 'Send Invite'}</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Staff;
