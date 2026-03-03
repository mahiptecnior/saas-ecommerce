import React, { useState, useEffect } from 'react';
import api from '../api/axios';

const Categories = () => {
    const [categories, setCategories] = useState([]);
    const [name, setName] = useState('');
    const [slug, setSlug] = useState('');
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

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await api.post('/categories', { name, slug: slug || name.toLowerCase().replace(/ /g, '-') });
            setName('');
            setSlug('');
            fetchCategories();
        } catch (error) {
            console.error('Error creating category', error);
        }
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

    return (
        <div className="fade-in">
            <div className="card">
                <h2>Product Categories</h2>
                <form onSubmit={handleCreate} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '1rem', marginTop: '1.5rem', marginBottom: '2rem' }}>
                    <input className="form-control" placeholder="Category Name" value={name} onChange={(e) => setName(e.target.value)} required />
                    <input className="form-control" placeholder="Slug (optional)" value={slug} onChange={(e) => setSlug(e.target.value)} />
                    <button type="submit" className="btn btn-primary">Add Category</button>
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
