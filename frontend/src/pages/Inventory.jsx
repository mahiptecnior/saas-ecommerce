import React, { useState, useEffect } from 'react';
import api from '../api/axios';

const Inventory = () => {
    const [activeTab, setActiveTab] = useState('stock');
    const [warehouses, setWarehouses] = useState([]);
    const [inventory, setInventory] = useState([]);
    const [batches, setBatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [msg, setMsg] = useState('');

    // Modal States
    const [showWhModal, setShowWhModal] = useState(false);
    const [whForm, setWhForm] = useState({ name: '', location: '', is_default: false });

    const [showAdjModal, setShowAdjModal] = useState(false);
    const [adjForm, setAdjForm] = useState({
        product_id: '',
        variant_id: '',
        warehouse_id: '',
        type: 'in', // in, out, adjustment
        quantity: 1,
        reference: ''
    });

    const [showBatchModal, setShowBatchModal] = useState(false);
    const [batchForm, setBatchForm] = useState({
        product_id: '',
        variant_id: '',
        warehouse_id: '',
        batch_number: '',
        expiry_date: '',
        quantity: 0
    });

    // Reference data for dropdowns
    const [products, setProducts] = useState([]);

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'warehouses') {
                const res = await api.get('/inventory/warehouses');
                setWarehouses(res.data.data);
            } else if (activeTab === 'stock') {
                const invRes = await Promise.all([
                    api.get('/inventory'),
                    api.get('/inventory/warehouses'),
                    api.get('/products')
                ]);
                setInventory(invRes[0].data.data);
                setWarehouses(invRes[1].data.data);
                setProducts(invRes[2].data.data);
            } else if (activeTab === 'batches') {
                const batchRes = await Promise.all([
                    api.get('/inventory/batches'),
                    api.get('/inventory/warehouses'),
                    api.get('/products')
                ]);
                setBatches(batchRes[0].data.data);
                setWarehouses(batchRes[1].data.data);
                setProducts(batchRes[2].data.data);
            }
        } catch (error) {
            console.error('Error fetching inventory data', error);
        } finally {
            setLoading(false);
        }
    };

    // --- Warehouse Handlers ---
    const handleCreateWarehouse = async (e) => {
        e.preventDefault();
        try {
            await api.post('/inventory/warehouses', whForm);
            setMsg('Warehouse created successfully');
            setShowWhModal(false);
            setWhForm({ name: '', location: '', is_default: false });
            fetchData();
        } catch (err) {
            alert('Error creating warehouse');
        }
    };

    // --- Batch Handlers ---
    const handleCreateBatch = async (e) => {
        e.preventDefault();
        try {
            const p = products.find(p => p.id === parseInt(batchForm.product_id));
            if (p?.variants?.length > 0 && !batchForm.variant_id) {
                return alert('Please select a variant for this batch');
            }

            await api.post('/inventory/batches', batchForm);
            setMsg('Batch created successfully');
            setShowBatchModal(false);
            setBatchForm({ product_id: '', variant_id: '', warehouse_id: '', batch_number: '', expiry_date: '', quantity: 0 });
            fetchData();
        } catch (err) {
            alert(err.response?.data?.message || 'Error creating batch');
        }
    };

    // --- Adjust Stock Handlers ---
    const handleAdjustStock = async (e) => {
        e.preventDefault();
        try {
            // Find variant_id logic: if product has variants, require it
            const p = products.find(p => p.id === parseInt(adjForm.product_id));
            if (p?.variants?.length > 0 && !adjForm.variant_id) {
                alert('Please select a variant');
                return;
            }

            await api.post('/inventory/adjust', adjForm);
            setMsg('Stock adjusted successfully');
            setShowAdjModal(false);
            setAdjForm({ ...adjForm, quantity: 1, reference: '' });
            fetchData();
        } catch (err) {
            alert(err.response?.data?.message || 'Error adjusting stock');
        }
    };

    // Derived states for adjustment form
    const selectedProduct = products.find(p => p.id === parseInt(adjForm.product_id));
    const requiresVariant = selectedProduct?.variants?.length > 0;

    const selectedBatchProduct = products.find(p => p.id === parseInt(batchForm.product_id));
    const batchRequiresVariant = selectedBatchProduct?.variants?.length > 0;

    return (
        <div className="fade-in">
            {msg && <div style={{ padding: '0.75rem', backgroundColor: 'var(--success)', color: '#fff', borderRadius: '8px', marginBottom: '1rem' }}>{msg}</div>}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2>Inventory Management</h2>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                        className={`btn ${activeTab === 'stock' ? 'btn-primary' : ''}`}
                        onClick={() => setActiveTab('stock')}
                        style={{ backgroundColor: activeTab !== 'stock' ? 'var(--surface)' : '', color: activeTab !== 'stock' ? 'var(--text)' : '', border: '1px solid var(--border)' }}
                    >🏷️ Stock Levels</button>
                    <button
                        className={`btn ${activeTab === 'batches' ? 'btn-primary' : ''}`}
                        onClick={() => setActiveTab('batches')}
                        style={{ backgroundColor: activeTab !== 'batches' ? 'var(--surface)' : '', color: activeTab !== 'batches' ? 'var(--text)' : '', border: '1px solid var(--border)' }}
                    >📦 Batches</button>
                    <button
                        className={`btn ${activeTab === 'warehouses' ? 'btn-primary' : ''}`}
                        onClick={() => setActiveTab('warehouses')}
                        style={{ backgroundColor: activeTab !== 'warehouses' ? 'var(--surface)' : '', color: activeTab !== 'warehouses' ? 'var(--text)' : '', border: '1px solid var(--border)' }}
                    >🏢 Warehouses</button>
                </div>
            </div>

            {/* WAREHOUSE TAB */}
            {activeTab === 'warehouses' && (
                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3>Registered Warehouses</h3>
                        <button className="btn btn-primary" onClick={() => setShowWhModal(true)}>+ Add Warehouse</button>
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
                                <th style={{ padding: '0.75rem' }}>Name</th>
                                <th style={{ padding: '0.75rem' }}>Location</th>
                                <th style={{ padding: '0.75rem' }}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? <tr><td colSpan="3" style={{ padding: '1rem', textAlign: 'center' }}>Loading...</td></tr> :
                                warehouses.map(w => (
                                    <tr key={w.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                        <td style={{ padding: '0.75rem', fontWeight: '500' }}>{w.name}</td>
                                        <td style={{ padding: '0.75rem' }}>{w.location || '-'}</td>
                                        <td style={{ padding: '0.75rem' }}>
                                            {w.is_default ? <span className="badge badge-active">Default</span> : null}
                                        </td>
                                    </tr>
                                ))
                            }
                        </tbody>
                    </table>
                </div>
            )}

            {/* STOCK LEVELS TAB */}
            {activeTab === 'stock' && (
                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3>Current Stock Levels</h3>
                        <button className="btn btn-primary" onClick={() => setShowAdjModal(true)}>⚖️ Adjust Stock</button>
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
                                <th style={{ padding: '0.75rem' }}>Warehouse</th>
                                <th style={{ padding: '0.75rem' }}>Product</th>
                                <th style={{ padding: '0.75rem' }}>Variant SKU</th>
                                <th style={{ padding: '0.75rem', textAlign: 'right' }}>Quantity</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? <tr><td colSpan="4" style={{ padding: '1rem', textAlign: 'center' }}>Loading...</td></tr> :
                                inventory.map(inv => (
                                    <tr key={inv.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                        <td style={{ padding: '0.75rem' }}>{inv.warehouse_name}</td>
                                        <td style={{ padding: '0.75rem', fontWeight: '500' }}>{inv.product_name} <br /><span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{inv.product_sku}</span></td>
                                        <td style={{ padding: '0.75rem' }}>{inv.variant_sku || '-'}</td>
                                        <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600', color: inv.quantity <= 5 ? 'var(--danger)' : 'var(--text)' }}>
                                            {inv.quantity}
                                        </td>
                                    </tr>
                                ))}
                            {inventory.length === 0 && !loading && (
                                <tr><td colSpan="4" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No stock records found. Try receiving a Purchase Order or doing a Manual Adjustment!</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* BATCH TAB */}
            {activeTab === 'batches' && (
                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3>Batch Management</h3>
                        <button className="btn btn-primary" onClick={() => setShowBatchModal(true)}>+ Add Batch</button>
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
                                <th style={{ padding: '0.75rem' }}>Batch #</th>
                                <th style={{ padding: '0.75rem' }}>Product / Variant</th>
                                <th style={{ padding: '0.75rem' }}>Warehouse</th>
                                <th style={{ padding: '0.75rem' }}>Expiry</th>
                                <th style={{ padding: '0.75rem', textAlign: 'right' }}>Qty</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? <tr><td colSpan="5" style={{ padding: '1rem', textAlign: 'center' }}>Loading...</td></tr> :
                                batches.map(b => (
                                    <tr key={b.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                        <td style={{ padding: '0.75rem', fontWeight: '500' }}>{b.batch_number}</td>
                                        <td style={{ padding: '0.75rem' }}>{b.product_name} <br /><span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{b.variant_sku || 'No Variant'}</span></td>
                                        <td style={{ padding: '0.75rem' }}>{b.warehouse_name}</td>
                                        <td style={{ padding: '0.75rem' }}>{b.expiry_date ? new Date(b.expiry_date).toLocaleDateString() : 'N/A'}</td>
                                        <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 'bold' }}>{b.quantity}</td>
                                    </tr>
                                ))
                            }
                            {batches.length === 0 && !loading && (
                                <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No batches found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* WAREHOUSE MODAL */}
            {showWhModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                    <div className="card" style={{ width: '400px' }}>
                        <h3>Add Warehouse</h3>
                        <form onSubmit={handleCreateWarehouse} style={{ marginTop: '1rem' }}>
                            <div className="form-group">
                                <label>Warehouse Name</label>
                                <input type="text" className="form-control" value={whForm.name} onChange={e => setWhForm({ ...whForm, name: e.target.value })} required placeholder="e.g. Main Hub" />
                            </div>
                            <div className="form-group">
                                <label>Location</label>
                                <input type="text" className="form-control" value={whForm.location} onChange={e => setWhForm({ ...whForm, location: e.target.value })} placeholder="e.g. New York, NY" />
                            </div>
                            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <input type="checkbox" id="isdef" checked={whForm.is_default} onChange={e => setWhForm({ ...whForm, is_default: e.target.checked })} />
                                <label htmlFor="isdef">Mark as Default Warehouse</label>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                                <button type="button" className="btn" onClick={() => setShowWhModal(false)} style={{ flex: 1, backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>Cancel</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* BATCH MODAL */}
            {showBatchModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                    <div className="card" style={{ width: '500px' }}>
                        <h3>Add Batch Manually</h3>
                        <form onSubmit={handleCreateBatch} style={{ marginTop: '1rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label>Product *</label>
                                    <select className="form-control" value={batchForm.product_id} onChange={e => setBatchForm({ ...batchForm, product_id: e.target.value, variant_id: '' })} required>
                                        <option value="">Select Product...</option>
                                        {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Warehouse *</label>
                                    <select className="form-control" value={batchForm.warehouse_id} onChange={e => setBatchForm({ ...batchForm, warehouse_id: e.target.value })} required>
                                        <option value="">Select Warehouse...</option>
                                        {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            {batchRequiresVariant && (
                                <div className="form-group">
                                    <label>Variant *</label>
                                    <select className="form-control" value={batchForm.variant_id} onChange={e => setBatchForm({ ...batchForm, variant_id: e.target.value })} required>
                                        <option value="">Select Variant...</option>
                                        {selectedBatchProduct.variants.map(v => <option key={v.id} value={v.id}>{v.variant_sku}</option>)}
                                    </select>
                                </div>
                            )}

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label>Batch Number *</label>
                                    <input type="text" className="form-control" value={batchForm.batch_number} onChange={e => setBatchForm({ ...batchForm, batch_number: e.target.value })} required placeholder="e.g. BATCH-001" />
                                </div>
                                <div className="form-group">
                                    <label>Expiry Date</label>
                                    <input type="date" className="form-control" value={batchForm.expiry_date} onChange={e => setBatchForm({ ...batchForm, expiry_date: e.target.value })} />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Initial Quantity</label>
                                <input type="number" className="form-control" min="0" value={batchForm.quantity} onChange={e => setBatchForm({ ...batchForm, quantity: e.target.value })} />
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                                <button type="button" className="btn" onClick={() => setShowBatchModal(false)} style={{ flex: 1, backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>Cancel</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Create Batch</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ADJUSTMENT MODAL */}
            {showAdjModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                    <div className="card" style={{ width: '500px' }}>
                        <h3>Adjust Stock</h3>
                        <form onSubmit={handleAdjustStock} style={{ marginTop: '1rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label>Product *</label>
                                    <select className="form-control" value={adjForm.product_id} onChange={e => setAdjForm({ ...adjForm, product_id: e.target.value, variant_id: '' })} required>
                                        <option value="">Select Product...</option>
                                        {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Warehouse *</label>
                                    <select className="form-control" value={adjForm.warehouse_id} onChange={e => setAdjForm({ ...adjForm, warehouse_id: e.target.value })} required>
                                        <option value="">Select Warehouse...</option>
                                        {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            {requiresVariant && (
                                <div className="form-group">
                                    <label>Variant *</label>
                                    <select className="form-control" value={adjForm.variant_id} onChange={e => setAdjForm({ ...adjForm, variant_id: e.target.value })} required>
                                        <option value="">Select Variant...</option>
                                        {selectedProduct.variants.map(v => <option key={v.id} value={v.id}>{v.variant_sku} (Price: ${v.price})</option>)}
                                    </select>
                                </div>
                            )}

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label>Type *</label>
                                    <select className="form-control" value={adjForm.type} onChange={e => setAdjForm({ ...adjForm, type: e.target.value })}>
                                        <option value="in">Add Stock (In)</option>
                                        <option value="out">Remove Stock (Out)</option>
                                        <option value="adjustment">Set Absolute Total</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Quantity *</label>
                                    <input type="number" className="form-control" min="1" value={adjForm.quantity} onChange={e => setAdjForm({ ...adjForm, quantity: e.target.value })} required />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Reference Note</label>
                                <input type="text" className="form-control" value={adjForm.reference} onChange={e => setAdjForm({ ...adjForm, reference: e.target.value })} placeholder="e.g. Audit, Damaged goods, Restock" />
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                                <button type="button" className="btn" onClick={() => setShowAdjModal(false)} style={{ flex: 1, backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>Cancel</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Apply Adjustment</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Inventory;
