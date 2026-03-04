import React, { useState, useEffect } from 'react';
import api from '../api/axios';

const Brands = () => {
    const [brands, setBrands] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingBrand, setEditingBrand] = useState(null);
    const [form, setForm] = useState({ name: '', description: '', logo_url: '', is_active: true });

    useEffect(() => {
        fetchBrands();
    }, []);

    const fetchBrands = async () => {
        try {
            const res = await api.get('/brands');
            setBrands(res.data.data);
        } catch (error) {
            console.error('Error fetching brands', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (editingBrand) {
                await api.put(`/brands/${editingBrand.id}`, form);
            } else {
                await api.post('/brands', form);
            }
            setShowModal(false);
            fetchBrands();
        } catch (error) {
            console.error('Error saving brand', error);
            alert('Error saving brand');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this brand?')) return;
        try {
            await api.delete(`/brands/${id}`);
            fetchBrands();
        } catch (error) {
            console.error('Error deleting brand', error);
            alert('Error deleting brand');
        }
    };

    const openModal = (brand = null) => {
        if (brand) {
            setEditingBrand(brand);
            setForm({ name: brand.name, description: brand.description || '', logo_url: brand.logo_url || '', is_active: brand.is_active });
        } else {
            setEditingBrand(null);
            setForm({ name: '', description: '', logo_url: '', is_active: true });
        }
        setShowModal(true);
    };

    if (loading) return <div className="fade-in">Loading brands...</div>;

    return (
        <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-main)' }}>Brand Management</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Manage your product brands and logos.</p>
                </div>
                <button className="btn btn-primary" onClick={() => openModal()}>+ Add Brand</button>
            </div>

            <div className="card">
                <table className="table">
                    <thead>
                        <tr>
                            <th>Logo</th>
                            <th>Name</th>
                            <th>Description</th>
                            <th>Status</th>
                            <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {brands.length === 0 ? (
                            <tr>
                                <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No brands found.</td>
                            </tr>
                        ) : (
                            brands.map(brand => (
                                <tr key={brand.id}>
                                    <td>
                                        {brand.logo_url ? (
                                            <img src={brand.logo_url} alt={brand.name} style={{ width: '40px', height: '40px', objectFit: 'contain', borderRadius: '4px' }} />
                                        ) : (
                                            <div style={{ width: '40px', height: '40px', backgroundColor: 'var(--border)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>No Logo</div>
                                        )}
                                    </td>
                                    <td style={{ fontWeight: '500' }}>{brand.name}</td>
                                    <td style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{brand.description || '-'}</td>
                                    <td>
                                        <span className={`badge ${brand.is_active ? 'badge-success' : 'badge-danger'}`} style={{
                                            padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem',
                                            backgroundColor: brand.is_active ? '#def7ec' : '#fde8e8',
                                            color: brand.is_active ? '#03543f' : '#9b1c1c'
                                        }}>
                                            {brand.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <button className="btn btn-sm" style={{ marginRight: '0.5rem', backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }} onClick={() => openModal(brand)}>Edit</button>
                                        <button className="btn btn-sm" style={{ backgroundColor: '#fee2e2', color: '#991b1b' }} onClick={() => handleDelete(brand.id)}>Delete</button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="modal-content card" style={{ width: '500px', padding: '2rem' }}>
                        <h3>{editingBrand ? 'Edit Brand' : 'Add New Brand'}</h3>
                        <form onSubmit={handleSave} style={{ marginTop: '1.5rem' }}>
                            <div className="form-group">
                                <label>Brand Name</label>
                                <input className="form-control" type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label>Logo URL</label>
                                <input className="form-control" type="text" value={form.logo_url} onChange={(e) => setForm({ ...form, logo_url: e.target.value })} placeholder="https://example.com/logo.png" />
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <textarea className="form-control" rows="3" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}></textarea>
                            </div>
                            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
                                <label style={{ margin: 0 }}>Active</label>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                                <button type="button" className="btn" style={{ backgroundColor: 'var(--border)' }} onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Save Brand</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Brands;
