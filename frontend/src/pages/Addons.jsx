import React, { useState, useEffect } from 'react';
import api from '../api/axios';

const Addons = () => {
    const [addons, setAddons] = useState([]);
    const [modules, setModules] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [form, setForm] = useState({ id: null, module_id: '', name: '', price_monthly: 0, price_yearly: 0, description: '', is_active: true });

    useEffect(() => { fetchAddons(); fetchModules(); }, []);

    const fetchAddons = async () => {
        try { const { data } = await api.get('/admin/addons'); setAddons(data.data); } catch (err) { console.error(err); }
    };

    const fetchModules = async () => {
        try { const { data } = await api.get('/admin/modules'); setModules(data.data); } catch (err) { console.error(err); }
    };

    const openCreate = () => { setEditMode(false); setForm({ id: null, module_id: '', name: '', price_monthly: 0, price_yearly: 0, description: '', is_active: true }); setIsModalOpen(true); };
    const openEdit = (addon) => { setEditMode(true); setForm({ ...addon }); setIsModalOpen(true); };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editMode) { await api.put(`/admin/addons/${form.id}`, form); }
            else { await api.post('/admin/addons', form); }
            setIsModalOpen(false);
            fetchAddons();
        } catch (err) { alert('Error saving addon'); }
    };

    const handleDelete = async (id) => {
        if (confirm('Delete this addon?')) {
            try { await api.delete(`/admin/addons/${id}`); fetchAddons(); } catch (err) { alert('Error'); }
        }
    };

    return (
        <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                    <h2>Add-On Modules</h2>
                    <p style={{ color: 'var(--text-muted)' }}>Purchasable extras beyond base plan modules.</p>
                </div>
                <button onClick={openCreate} className="btn btn-primary">+ Create Add-On</button>
            </div>

            <div className="card" style={{ overflow: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
                            <th style={{ padding: '0.75rem' }}>Name</th>
                            <th style={{ padding: '0.75rem' }}>Module</th>
                            <th style={{ padding: '0.75rem' }}>Monthly</th>
                            <th style={{ padding: '0.75rem' }}>Yearly</th>
                            <th style={{ padding: '0.75rem' }}>Status</th>
                            <th style={{ padding: '0.75rem' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {addons.map(a => (
                            <tr key={a.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                <td style={{ padding: '0.75rem', fontWeight: '500' }}>{a.name}</td>
                                <td style={{ padding: '0.75rem' }}>{a.module_name}</td>
                                <td style={{ padding: '0.75rem', color: 'var(--primary)' }}>${a.price_monthly}</td>
                                <td style={{ padding: '0.75rem' }}>${a.price_yearly}</td>
                                <td style={{ padding: '0.75rem' }}><span className={`badge badge-${a.is_active ? 'active' : 'suspended'}`}>{a.is_active ? 'Active' : 'Inactive'}</span></td>
                                <td style={{ padding: '0.75rem' }}>
                                    <button onClick={() => openEdit(a)} className="btn btn-outline" style={{ padding: '3px 8px', fontSize: '11px', marginRight: '0.3rem' }}>Edit</button>
                                    <button onClick={() => handleDelete(a.id)} className="btn btn-danger" style={{ padding: '3px 8px', fontSize: '11px' }}>Delete</button>
                                </td>
                            </tr>
                        ))}
                        {addons.length === 0 && <tr><td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No add-ons created yet.</td></tr>}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="card" style={{ width: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <h3>{editMode ? 'Edit Add-On' : 'Create Add-On'}</h3>
                            <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem' }}>&times;</button>
                        </div>
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.3rem' }}>Name</label>
                                <input className="input-field" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.3rem' }}>Linked Module</label>
                                <select className="input-field" value={form.module_id} onChange={e => setForm({ ...form, module_id: e.target.value })} required>
                                    <option value="">Select Module</option>
                                    {modules.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                </select>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.3rem' }}>Monthly Price ($)</label>
                                    <input className="input-field" type="number" step="0.01" value={form.price_monthly} onChange={e => setForm({ ...form, price_monthly: e.target.value })} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.3rem' }}>Yearly Price ($)</label>
                                    <input className="input-field" type="number" step="0.01" value={form.price_yearly} onChange={e => setForm({ ...form, price_yearly: e.target.value })} />
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.3rem' }}>Description</label>
                                <textarea className="input-field" rows="3" value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} />
                            </div>
                            {editMode && (
                                <div>
                                    <label><input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} /> Active</label>
                                </div>
                            )}
                            <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>{editMode ? 'Update' : 'Create'} Add-On</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Addons;
