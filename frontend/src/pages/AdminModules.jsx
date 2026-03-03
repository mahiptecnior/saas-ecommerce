import React, { useState, useEffect } from 'react';
import api from '../api/axios';

const AdminModules = () => {
    const [modules, setModules] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);

    // Form state
    const [id, setId] = useState(null);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [isActive, setIsActive] = useState(true);

    useEffect(() => {
        fetchModules();
    }, []);

    const fetchModules = async () => {
        try {
            const { data } = await api.get('/admin/modules');
            setModules(data.data);
        } catch (err) {
            console.error('Error fetching modules', err);
        }
    };

    const openCreateModal = () => {
        setEditMode(false);
        setId(null);
        setName('');
        setDescription('');
        setIsActive(true);
        setIsModalOpen(true);
    };

    const openEditModal = (mod) => {
        setEditMode(true);
        setId(mod.id);
        setName(mod.name);
        setDescription(mod.description || '');
        setIsActive(mod.is_active === 1 || mod.is_active === true);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const payload = { name, description, is_active: isActive ? 1 : 0 };

        try {
            if (editMode) {
                await api.put(`/admin/modules/${id}`, payload);
            } else {
                await api.post('/admin/modules', payload);
            }
            closeModal();
            fetchModules();
        } catch (err) {
            alert(editMode ? 'Error updating module' : 'Error creating module');
        }
    };

    const handleDelete = async (moduleId) => {
        if (window.confirm('Are you sure you want to delete this module? This might break permissions if tenants are currently assigned to it.')) {
            try {
                await api.delete(`/admin/modules/${moduleId}`);
                fetchModules();
            } catch (err) {
                alert('Error deleting module');
            }
        }
    };

    return (
        <div className="animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h2>Dynamic Modules Management</h2>
                    <p className="text-muted">Define the functional modules available to be assigned to tenants based on their plans.</p>
                </div>
                <button onClick={openCreateModal} className="btn btn-primary">+ Create New Module</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                {modules.map(mod => (
                    <div key={mod.id} className="card" style={{ borderTop: `4px solid ${mod.is_active ? 'var(--primary)' : 'var(--text-muted)'}`, position: 'relative' }}>
                        <div style={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex', gap: '0.5rem' }}>
                            <button onClick={() => openEditModal(mod)} className="btn btn-outline" style={{ padding: '4px 12px', fontSize: '12px' }}>Edit</button>
                            <button onClick={() => handleDelete(mod.id)} className="btn btn-danger" style={{ padding: '4px 12px', fontSize: '12px' }}>Delete</button>
                        </div>
                        <h4 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', textTransform: 'capitalize', width: '65%' }}>{mod.name}</h4>
                        <div style={{ marginBottom: '1rem' }}>
                            <span className={`badge ${mod.is_active ? 'badge-active' : 'badge-suspended'}`}>
                                {mod.is_active ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: '1.4' }}>
                            {mod.description || 'No description provided. Enable various business features for the tenant.'}
                        </p>
                    </div>
                ))}
            </div>

            {isModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
                    <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '500px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3>{editMode ? 'Edit Module' : 'Create New Module'}</h3>
                            <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem', color: 'var(--text-muted)' }}>&times;</button>
                        </div>
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: '500' }}>Module Code Name</label>
                                <input className="input-field" value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. inventory, pos, loyalty" />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: '500' }}>Description (Optional)</label>
                                <textarea className="input-field" rows="3" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What does this module do?"></textarea>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <input type="checkbox" id="isActive" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} style={{ transform: 'scale(1.2)' }} />
                                <label htmlFor="isActive" style={{ fontWeight: '500', cursor: 'pointer' }}>Active (Available for assignment)</label>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                                <button type="button" className="btn btn-outline" onClick={closeModal}>Cancel</button>
                                <button type="submit" className="btn btn-primary">{editMode ? 'Save Changes' : 'Create Module'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminModules;
