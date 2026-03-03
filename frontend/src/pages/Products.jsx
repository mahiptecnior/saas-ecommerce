import React, { useState, useEffect } from 'react';
import api from '../api/axios';

const Products = () => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [newProduct, setNewProduct] = useState({
        name: '',
        description: '',
        price: '',
        sku: '',
        inventory_quantity: 0,
        low_stock_threshold: 5,
        tags: '',
        category_id: '',
        variants: []
    });

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            const [prodRes, catRes] = await Promise.all([
                api.get('/products'),
                api.get('/categories')
            ]);
            setProducts(prodRes.data.data);
            setCategories(catRes.data.data);
        } catch (error) {
            console.error('Error fetching data', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await api.post('/products', newProduct);
            fetchInitialData();
            setShowModal(false);
            setNewProduct({ name: '', description: '', price: '', sku: '', inventory_quantity: 0, low_stock_threshold: 5, tags: '', category_id: '', variants: [] });
        } catch (error) {
            console.error('Error creating product', error);
        }
    };

    const addVariant = () => {
        setNewProduct({
            ...newProduct,
            variants: [...newProduct.variants, { name: '', value: '' }]
        });
    };

    return (
        <div className="fade-in">
            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2>Products Management</h2>
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}>Add Product</button>
                </div>
                {loading ? (
                    <p>Loading...</p>
                ) : (
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Category</th>
                                <th>SKU</th>
                                <th>Price</th>
                                <th>Inventory</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map((product) => (
                                <tr key={product.id}>
                                    <td>
                                        <strong>{product.name}</strong>
                                        {product.inventory_quantity <= product.low_stock_threshold && (
                                            <span style={{ marginLeft: '0.5rem', color: 'var(--error)', fontSize: '0.75rem' }}>Low Stock!</span>
                                        )}
                                    </td>
                                    <td>{categories.find(c => c.id === product.category_id)?.name || 'Uncategorized'}</td>
                                    <td>{product.sku || 'N/A'}</td>
                                    <td>${product.price}</td>
                                    <td>{product.inventory_quantity}</td>
                                    <td>
                                        <span className={`status-badge status-${product.status}`}>
                                            {product.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {showModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
                }}>
                    <div className="card" style={{ width: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <h2>Add New Product</h2>
                        <form onSubmit={handleCreate}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label>Product Name</label>
                                    <input className="form-control" type="text" value={newProduct.name} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label>Category</label>
                                    <select className="form-control" value={newProduct.category_id} onChange={(e) => setNewProduct({ ...newProduct, category_id: e.target.value })}>
                                        <option value="">Select Category</option>
                                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Description</label>
                                <textarea className="form-control" value={newProduct.description} onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}></textarea>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label>Price</label>
                                    <input className="form-control" type="number" step="0.01" value={newProduct.price} onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label>SKU</label>
                                    <input className="form-control" type="text" value={newProduct.sku} onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })} />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label>Initial Stock</label>
                                    <input className="form-control" type="number" value={newProduct.inventory_quantity} onChange={(e) => setNewProduct({ ...newProduct, inventory_quantity: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Low Stock Threshold</label>
                                    <input className="form-control" type="number" value={newProduct.low_stock_threshold} onChange={(e) => setNewProduct({ ...newProduct, low_stock_threshold: e.target.value })} />
                                </div>
                            </div>

                            <div className="form-group">
                                <label style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    Variants (Size, Color, etc.)
                                    <button type="button" onClick={addVariant} style={{ fontSize: '10px', padding: '2px 5px' }} className="btn">Add Variant</button>
                                </label>
                                {newProduct.variants.map((v, idx) => (
                                    <div key={idx} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                        <input className="form-control" placeholder="Type (e.g. Size)" value={v.name} onChange={(e) => {
                                            const vts = [...newProduct.variants];
                                            vts[idx].name = e.target.value;
                                            setNewProduct({ ...newProduct, variants: vts });
                                        }} />
                                        <input className="form-control" placeholder="Value (e.g. XL)" value={v.value} onChange={(e) => {
                                            const vts = [...newProduct.variants];
                                            vts[idx].value = e.target.value;
                                            setNewProduct({ ...newProduct, variants: vts });
                                        }} />
                                    </div>
                                ))}
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Create Product</button>
                                <button type="button" className="btn" style={{ flex: 1, backgroundColor: 'var(--border)' }} onClick={() => setShowModal(false)}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Products;
