import React, { useState, useEffect } from 'react';
import api from '../api/axios';

const AdminThemes = () => {
    const [themes, setThemes] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [form, setForm] = useState({ id: null, name: '', description: '', preview_url: '', is_active: true });

    useEffect(() => { fetchThemes(); }, []);

    const fetchThemes = async () => {
        try { const { data } = await api.get('/admin/themes'); setThemes(data.data); } catch (err) { console.error(err); }
    };

    const openCreate = () => { setEditMode(false); setForm({ id: null, name: '', description: '', preview_url: '', is_active: true }); setIsModalOpen(true); };
    const openEdit = (t) => { setEditMode(true); setForm({ ...t }); setIsModalOpen(true); };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editMode) await api.put(`/admin/themes/${form.id}`, form);
            else await api.post('/admin/themes', form);
            setIsModalOpen(false);
            fetchThemes();
        } catch (err) { alert('Error saving theme'); }
    };

    const handleDelete = async (id) => {
        if (confirm('Delete this theme?')) {
            try { await api.delete(`/admin/themes/${id}`); fetchThemes(); } catch (err) { alert('Error'); }
        }
    };

    return (
        <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                    <h2>Theme Marketplace</h2>
                    <p style={{ color: 'var(--text-muted)' }}>Manage storefront themes for tenants.</p>
                </div>
                <button onClick={openCreate} className="btn btn-primary">+ Create Theme</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                {themes.map(t => (
                    <div key={t.id} className="card" style={{ position: 'relative' }}>
                        <div style={{ height: '140px', background: 'linear-gradient(135deg, var(--primary), var(--success))', borderRadius: '8px', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '2rem' }}>
                            {t.preview_url ? <img src={t.preview_url} alt={t.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} /> : '🎨'}
                        </div>
                        <h3 style={{ marginBottom: '0.3rem' }}>{t.name}</h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>{t.description || 'No description'}</p>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <span className={`badge badge-${t.is_active ? 'active' : 'suspended'}`}>{t.is_active ? 'Active' : 'Inactive'}</span>
                            <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.3rem' }}>
                                <button onClick={() => openEdit(t)} className="btn btn-outline" style={{ padding: '3px 8px', fontSize: '11px' }}>Edit</button>
                                <button onClick={() => handleDelete(t.id)} className="btn btn-danger" style={{ padding: '3px 8px', fontSize: '11px' }}>Delete</button>
                            </div>
                        </div>
                    </div>
                ))}
                {themes.length === 0 && (
                    <div className="card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                        No themes created yet. Create your first theme!
                    </div>
                )}
            </div>

            {isModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="card" style={{ width: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <h3>{editMode ? 'Edit Theme' : 'Create Theme'}</h3>
                            <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem' }}>&times;</button>
                        </div>
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.3rem' }}>Name</label>
                                <input className="input-field" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.3rem' }}>Description</label>
                                <textarea className="input-field" rows="3" value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.3rem' }}>Preview URL</label>
                                <input className="input-field" value={form.preview_url || ''} onChange={e => setForm({ ...form, preview_url: e.target.value })} placeholder="https://..." />
                            </div>
                            {editMode && (
                                <label><input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} /> Active</label>
                            )}
                            <button type="submit" className="btn btn-primary">{editMode ? 'Update' : 'Create'} Theme</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminThemes;
