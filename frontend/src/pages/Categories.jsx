import React, { useState, useEffect } from 'react';
import api from '../api/axios';

const Categories = () => {
    const [categories, setCategories] = useState([]);
    const [name, setName] = useState('');
    const [slug, setSlug] = useState('');
    const [editingCategory, setEditingCategory] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const res = await api.get('/categories');
            setCategories(res.data.data);
        } catch (error) {
            console.error('Error fetching categories', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            const payload = { name, slug: slug || name.toLowerCase().replace(/ /g, '-') };
            if (editingCategory) {
                await api.put(`/categories/${editingCategory.id}`, payload);
            } else {
                await api.post('/categories', payload);
            }
            setName('');
            setSlug('');
            setEditingCategory(null);
            fetchCategories();
        } catch (error) {
            console.error('Error saving category', error);
        }
    };

    const handleEdit = (cat) => {
        setEditingCategory(cat);
        setName(cat.name);
        setSlug(cat.slug || '');
    };

    const handleDelete = async (id) => {
        if (window.confirm('Delete this category?')) {
            try {
                await api.delete(`/categories/${id}`);
                fetchCategories();
            } catch (error) {
                console.error('Error deleting category', error);
            }
        }
    };

    const cancelEdit = () => {
        setEditingCategory(null);
        setName('');
        setSlug('');
    };

    return (
        <div className="fade-in">
            <div className="card">
                <h2>Product Categories</h2>
                <form onSubmit={handleSave} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto auto', gap: '1rem', marginTop: '1.5rem', marginBottom: '2rem' }}>
                    <input className="form-control" placeholder="Category Name" value={name} onChange={(e) => setName(e.target.value)} required />
                    <input className="form-control" placeholder="Slug (optional)" value={slug} onChange={(e) => setSlug(e.target.value)} />
                    <button type="submit" className="btn btn-primary">{editingCategory ? 'Update' : 'Add Category'}</button>
                    {editingCategory && <button type="button" className="btn" onClick={cancelEdit}>Cancel</button>}
                </form>

                {loading ? <p>Loading...</p> : (
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Slug</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {categories.map(cat => (
                                <tr key={cat.id}>
                                    <td>{cat.name}</td>
                                    <td>{cat.slug}</td>
                                    <td>
                                        <button className="btn btn-sm" style={{ marginRight: '0.5rem', backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }} onClick={() => handleEdit(cat)}>Edit</button>
                                        <button className="btn" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', backgroundColor: 'var(--error)', color: '#fff' }} onClick={() => handleDelete(cat.id)}>Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default Categories;
