import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';

const Products = () => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [brands, setBrands] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);

    // Limits & Upgrades
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [importFile, setImportFile] = useState(null);
    const [importLoading, setImportLoading] = useState(false);
    const [limitMsg, setLimitMsg] = useState('');
    const navigate = useNavigate();

    const [form, setForm] = useState({
        name: '', description: '', price: '', sku: '', inventory_quantity: 0,
        low_stock_threshold: 5, tags: '', category_id: '', brand_id: '',
        status: 'active', variants: [], has_variants: false
    });

    const [optionTypes, setOptionTypes] = useState([{ name: '', values: '' }]);

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async (forceStore = false) => {
        // If we already have brands and categories, only fetch products unless forced
        if (brands.length > 0 && categories.length > 0 && !forceStore) {
            try {
                const res = await api.get('/products');
                setProducts(res.data.data);
                return;
            } catch (error) {
                console.error('Error fetching products', error);
                return;
            }
        }

        try {
            const [prodRes, catRes, brandRes] = await Promise.all([
                api.get('/products'),
                api.get('/categories'),
                api.get('/brands')
            ]);
            setProducts(prodRes.data.data);
            setCategories(catRes.data.data);
            setBrands(brandRes.data.data);
        } catch (error) {
            console.error('Error fetching data', error);
        } finally {
            setLoading(false);
        }
    };

    const handleImport = async (e) => {
        e.preventDefault();
        if (!importFile) return;

        const formData = new FormData();
        formData.append('file', importFile);

        setImportLoading(true);
        try {
            const res = await api.post('/products/bulk-upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert(res.data.message);
            setShowImportModal(false);
            fetchInitialData();
            setImportFile(null);
        } catch (error) {
            console.error('Import error', error);
            alert(error.response?.data?.message || 'Error uploading file');
        } finally {
            setImportLoading(false);
        }
    };

    const downloadSampleCSV = () => {
        const headers = ["name", "description", "price", "sku", "inventory_quantity"];
        const rows = [
            ["Sample Product 1", "Great product description", "19.99", "SKU001", "100"],
            ["Sample Product 2", "Another description", "25.50", "SKU002", "50"]
        ];

        let csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + rows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "products_import_template.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...form };
            if (!form.has_variants) {
                payload.variants = [];
            } else {
                // Compile b2b_pricing for each variant before saving
                payload.variants = form.variants.map(v => {
                    const b2b = [];
                    if (v.wholesale_price) b2b.push({ tier: 'wholesale', price: parseFloat(v.wholesale_price) });
                    if (v.vip_price) b2b.push({ tier: 'vip', price: parseFloat(v.vip_price) });
                    return { ...v, b2b_pricing: b2b };
                });
            }

            if (editingProduct) {
                await api.put(`/products/${editingProduct.id}`, payload);
            } else {
                await api.post('/products', payload);
            }
            fetchInitialData();
            setShowModal(false);
            resetForm();
        } catch (error) {
            if (error.response && error.response.status === 403 && error.response.data.errorCode === 'LIMIT_REACHED') {
                setShowModal(false);
                setLimitMsg(error.response.data.message);
                setShowUpgradeModal(true);
            } else {
                console.error('Error saving product', error);
                alert('Failed to save product. Please try again.');
            }
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this product?')) return;
        try {
            await api.delete(`/products/${id}`);
            fetchInitialData();
        } catch (error) {
            alert('Error deleting product');
        }
    };

    const resetForm = () => {
        setForm({
            name: '', description: '', price: '', sku: '', inventory_quantity: 0,
            low_stock_threshold: 5, tags: '', category_id: '', brand_id: '',
            status: 'active', variants: [], has_variants: false
        });
        setOptionTypes([{ name: '', values: '' }]);
        setEditingProduct(null);
    };

    const openModal = async (product = null) => {
        // Re-fetch brands/categories to ensure dropdowns are fresh
        await fetchInitialData(true);

        if (product) {
            setEditingProduct(product);
            const hasVariants = product.variants && product.variants.length > 0;

            // Map b2b_pricing back to flat UI fields if present
            const mappedVariants = (product.variants || []).map(v => {
                const b2b = v.b2b_pricing || [];
                const wholesale = b2b.find(b => b.tier === 'wholesale')?.price || '';
                const vip = b2b.find(b => b.tier === 'vip')?.price || '';
                return { ...v, wholesale_price: wholesale, vip_price: vip };
            });

            setForm({
                name: product.name,
                description: product.description || '',
                price: product.price,
                sku: product.sku || '',
                inventory_quantity: product.inventory_quantity,
                low_stock_threshold: product.low_stock_threshold,
                tags: product.tags || '',
                category_id: product.category_id || '',
                brand_id: product.brand_id || '',
                status: product.status,
                variants: mappedVariants,
                has_variants: hasVariants
            });
            // Don't auto-fill optionTypes for now, as it's a generator tool
        } else {
            resetForm();
        }
        setShowModal(true);
    };

    // Variant Matrix Logic
    const generateVariants = () => {
        const validOptions = optionTypes.filter(ot => ot.name && ot.values);
        if (validOptions.length === 0) return;

        const optionMatrix = validOptions.map(ot =>
            ot.values.split(',').map(v => ({ [ot.name]: v.trim() }))
        );

        const cartesian = (...args) => args.reduce((a, b) => a.flatMap(d => b.map(e => ({ ...d, ...e }))));
        const combinations = cartesian(...optionMatrix);

        const newVariants = combinations.map(combo => ({
            variant_sku: `${form.sku}-${Object.values(combo).join('-')}`,
            price: form.price || 0,
            wholesale_price: '',
            vip_price: '',
            stock_quantity: 0,
            attributes_json: combo
        }));

        setForm({ ...form, variants: newVariants, has_variants: true });
    };

    if (loading) return <div className="fade-in">Loading products...</div>;

    return (
        <div className="fade-in">
            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: '700' }}>Products Management</h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Manage inventory, brands, and product variations.</p>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button className="btn btn-outline" style={{ border: '1px solid var(--border)' }} onClick={() => setShowImportModal(true)}>Import Products</button>
                        <button className="btn btn-primary" onClick={() => openModal()}>+ Add Product</button>
                    </div>
                </div>

                <table className="table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Brand</th>
                            <th>Category</th>
                            <th>Base Price</th>
                            <th>Stock</th>
                            <th>Variants</th>
                            <th>Status</th>
                            <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.length === 0 ? (
                            <tr>
                                <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No products found.</td>
                            </tr>
                        ) : (
                            products.map((product) => (
                                <tr key={product.id}>
                                    <td>
                                        <strong style={{ display: 'block' }}>{product.name}</strong>
                                        {product.inventory_quantity <= product.low_stock_threshold && (
                                            <span style={{ color: 'var(--error)', fontSize: '0.7rem', fontWeight: 'bold' }}>Low Stock!</span>
                                        )}
                                    </td>
                                    <td style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{product.brand_name || '-'}</td>
                                    <td style={{ fontSize: '0.9rem' }}>{categories.find(c => c.id === product.category_id)?.name || '-'}</td>
                                    <td style={{ fontWeight: '600' }}>${parseFloat(product.price).toFixed(2)}</td>
                                    <td>{product.inventory_quantity}</td>
                                    <td>
                                        <span style={{ fontSize: '0.8rem', backgroundColor: '#eef2ff', color: '#4338ca', padding: '2px 8px', borderRadius: '10px' }}>
                                            {product.variants?.length || 0} variants
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`badge ${product.status === 'active' ? 'badge-success' : 'badge-warning'}`} style={{
                                            padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem',
                                            backgroundColor: product.status === 'active' ? '#def7ec' : '#fef3c7',
                                            color: product.status === 'active' ? '#03543f' : '#92400e'
                                        }}>
                                            {product.status}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <button className="btn btn-sm" style={{ marginRight: '0.5rem', backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }} onClick={() => openModal(product)}>Edit</button>
                                        <button className="btn btn-sm" style={{ backgroundColor: '#fee2e2', color: '#991b1b' }} onClick={() => handleDelete(product.id)}>Delete</button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                    <div className="card" style={{ width: '800px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem' }}>
                        <h3>{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
                        <form onSubmit={handleSave} style={{ marginTop: '1.5rem' }}>
                            {/* BASIC INFO */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                <div className="form-group">
                                    <label>Product Name</label>
                                    <input className="form-control" type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label>Brand</label>
                                    <select className="form-control" value={form.brand_id} onChange={(e) => setForm({ ...form, brand_id: e.target.value })}>
                                        <option value="">Select Brand</option>
                                        {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                <div className="form-group">
                                    <label>Category</label>
                                    <select className="form-control" value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
                                        <option value="">Select Category</option>
                                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Base Price ($)</label>
                                    <input className="form-control" type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Description</label>
                                <textarea className="form-control" rows="2" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}></textarea>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label>Base SKU</label>
                                    <input className="form-control" type="text" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Total Stock</label>
                                    <input className="form-control" type="number" value={form.inventory_quantity} onChange={(e) => setForm({ ...form, inventory_quantity: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Low Stock Alert</label>
                                    <input className="form-control" type="number" value={form.low_stock_threshold} onChange={(e) => setForm({ ...form, low_stock_threshold: e.target.value })} />
                                </div>
                            </div>

                            {/* ADVANCED VARIANTS */}
                            <div style={{ marginTop: '2rem', padding: '1.5rem', border: '1px solid var(--border)', borderRadius: '12px', background: '#f9fafb' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                    <h4 style={{ margin: 0 }}>Product Variants</h4>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <input type="checkbox" checked={form.has_variants} onChange={(e) => setForm({ ...form, has_variants: e.target.checked })} />
                                        <label style={{ margin: 0, fontSize: '0.9rem' }}>Enable Variants</label>
                                    </div>
                                </div>

                                {form.has_variants && (
                                    <>
                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Define options like Size (S, M, L) to generate variants.</p>
                                        {optionTypes.map((ot, idx) => (
                                            <div key={idx} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                                <input className="form-control" placeholder="Option (e.g. Size)" value={ot.name} onChange={(e) => {
                                                    const newOts = [...optionTypes];
                                                    newOts[idx].name = e.target.value;
                                                    setOptionTypes(newOts);
                                                }} />
                                                <input className="form-control" placeholder="Values (comma separated)" value={ot.values} onChange={(e) => {
                                                    const newOts = [...optionTypes];
                                                    newOts[idx].values = e.target.value;
                                                    setOptionTypes(newOts);
                                                }} />
                                                <button type="button" className="btn btn-sm" style={{ color: 'red' }} onClick={() => setOptionTypes(optionTypes.filter((_, i) => i !== idx))}>×</button>
                                            </div>
                                        ))}
                                        <button type="button" className="btn btn-sm" style={{ marginBottom: '1rem' }} onClick={() => setOptionTypes([...optionTypes, { name: '', values: '' }])}>+ Add Option Type</button>
                                        <button type="button" className="btn btn-sm btn-primary" style={{ display: 'block', width: '100%', marginBottom: '1.5rem' }} onClick={generateVariants}>Generate Variant Matrix</button>

                                        {form.variants.length > 0 && (
                                            <table className="table" style={{ fontSize: '0.85rem', background: '#fff' }}>
                                                <thead>
                                                    <tr>
                                                        <th>Variant</th>
                                                        <th>SKU</th>
                                                        <th>Base Price</th>
                                                        <th>Wholesale Price</th>
                                                        <th>VIP Price</th>
                                                        <th>Stock</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {form.variants.map((v, idx) => (
                                                        <tr key={idx}>
                                                            <td style={{ fontWeight: '500' }}>{Object.values(v.attributes_json).join(' / ')}</td>
                                                            <td><input className="form-control form-control-sm" value={v.variant_sku} onChange={(e) => {
                                                                const vts = [...form.variants];
                                                                vts[idx].variant_sku = e.target.value;
                                                                setForm({ ...form, variants: vts });
                                                            }} /></td>
                                                            <td><input className="form-control form-control-sm" type="number" step="0.01" value={v.price} onChange={(e) => {
                                                                const vts = [...form.variants];
                                                                vts[idx].price = e.target.value;
                                                                setForm({ ...form, variants: vts });
                                                            }} /></td>
                                                            <td><input className="form-control form-control-sm" type="number" step="0.01" placeholder="Optional" value={v.wholesale_price || ''} onChange={(e) => {
                                                                const vts = [...form.variants];
                                                                vts[idx].wholesale_price = e.target.value;
                                                                setForm({ ...form, variants: vts });
                                                            }} /></td>
                                                            <td><input className="form-control form-control-sm" type="number" step="0.01" placeholder="Optional" value={v.vip_price || ''} onChange={(e) => {
                                                                const vts = [...form.variants];
                                                                vts[idx].vip_price = e.target.value;
                                                                setForm({ ...form, variants: vts });
                                                            }} /></td>
                                                            <td><input className="form-control form-control-sm" type="number" value={v.stock_quantity} onChange={(e) => {
                                                                const vts = [...form.variants];
                                                                vts[idx].stock_quantity = e.target.value;
                                                                setForm({ ...form, variants: vts });
                                                            }} /></td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        )}
                                    </>
                                )}
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>{editingProduct ? 'Update Product' : 'Create Product'}</button>
                                <button type="button" className="btn" style={{ flex: 1, backgroundColor: 'var(--border)' }} onClick={() => setShowModal(false)}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Bulk Import Modal */}
            {showImportModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                    <div className="card" style={{ width: '500px', padding: '2rem' }}>
                        <h3>Import Products (CSV)</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Upload a CSV file with headers: name, description, price, sku, inventory_quantity.</p>

                        <div style={{ marginBottom: '1.5rem', padding: '1rem', border: '2px dashed var(--border)', borderRadius: '12px', textAlign: 'center' }}>
                            <input type="file" accept=".csv" onChange={(e) => setImportFile(e.target.files[0])} style={{ marginBottom: '1rem' }} />
                            {importFile && <p style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: '600' }}>Selected: {importFile.name}</p>}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <button className="btn btn-link" style={{ fontSize: '0.9rem', color: 'var(--primary)', padding: 0 }} onClick={downloadSampleCSV}>Download Sample CSV</button>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', marginTop: '2.5rem' }}>
                            <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleImport} disabled={!importFile || importLoading}>
                                {importLoading ? 'Importing...' : 'Upload & Import'}
                            </button>
                            <button className="btn" style={{ flex: 1, backgroundColor: 'var(--border)' }} onClick={() => { setShowImportModal(false); setImportFile(null); }}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Upgrade Plan Modal */}
            {showUpgradeModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100, backdropFilter: 'blur(3px)' }}>
                    <div className="card" style={{ width: '450px', textAlign: 'center', padding: '2rem' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔒</div>
                        <h3>Limit Reached</h3>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>{limitMsg}</p>
                        <button className="btn btn-primary" onClick={() => navigate('/tenant/billing')}>Upgrade Plan</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Products;
