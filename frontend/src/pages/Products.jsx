import React, { useState, useEffect } from 'react';
import api from '../api/axios';

const Products = () => {
    const [products, setProducts] = useState([]);
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const { data } = await api.get('/products');
            setProducts(data.data);
        } catch (err) {
            console.error('Error fetching products', err);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await api.post('/products', { name, price });
            setName('');
            setPrice('');
            fetchProducts();
        } catch (err) {
            alert('Error creating product');
        }
    };

    return (
        <div>
            <div className="card">
                <h3>Add New Product</h3>
                <form onSubmit={handleCreate} style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                    <input
                        className="input-field"
                        placeholder="Product Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                    <input
                        className="input-field"
                        type="number"
                        placeholder="Price"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        required
                    />
                    <button type="submit" className="btn btn-primary" style={{ height: '42px' }}>Add Product</button>
                </form>
            </div>

            <div className="card" style={{ marginTop: '2rem' }}>
                <h3>Inventory</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
                    {products.map(p => (
                        <div key={p.id} className="card" style={{ margin: 0 }}>
                            <h4>{p.name}</h4>
                            <p style={{ color: 'var(--primary)', fontWeight: 'bold' }}>${p.price}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Products;
