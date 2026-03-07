import React, { useState, useEffect } from 'react';
import api from '../api/axios';

const Purchases = () => {
    const [activeTab, setActiveTab] = useState('orders');
    const [vendors, setVendors] = useState([]);
    const [orders, setOrders] = useState([]);
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [msg, setMsg] = useState('');

    // Common Dropdown Data
    const [products, setProducts] = useState([]);
    const [warehouses, setWarehouses] = useState([]);

    // Modals
    const [showVendorModal, setShowVendorModal] = useState(false);
    const [vendorForm, setVendorForm] = useState({ name: '', contact_name: '', email: '', phone: '', address: '' });

    const [showPOModal, setShowPOModal] = useState(false);
    const [poForm, setPoForm] = useState({ vendor_id: '', po_number: '', items: [] });
    // Item form for adding to PO
    const [poItem, setPoItem] = useState({ product_id: '', variant_id: '', quantity: 1, unit_price: 0 });

    const [showReceiveModal, setShowReceiveModal] = useState(false);
    const [receiveForm, setReceiveForm] = useState({ po_id: null, warehouse_id: '' });

    const [showInvoiceModal, setShowInvoiceModal] = useState(false);
    const [invoiceForm, setInvoiceForm] = useState({ po_id: '', vendor_id: '', invoice_number: '', total: 0, due_date: '' });

    const [showLedgerModal, setShowLedgerModal] = useState(false);
    const [ledgerData, setLedgerData] = useState({ ledger: [], balance: 0, vendorName: '', vendorId: '' });
    const [paymentForm, setPaymentForm] = useState({ amount: '', reference: '' });

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'vendors') {
                const res = await api.get('/purchases/vendors');
                setVendors(res.data.data);
            } else if (activeTab === 'orders') {
                const [poRes, venRes, prodRes, whRes] = await Promise.all([
                    api.get('/purchases/orders'),
                    api.get('/purchases/vendors'),
                    api.get('/products'),
                    api.get('/inventory/warehouses')
                ]);
                setOrders(poRes.data.data);
                setVendors(venRes.data.data);
                setProducts(prodRes.data.data);
                setWarehouses(whRes.data.data);
            } else if (activeTab === 'invoices') {
                const [invRes, poRes, venRes] = await Promise.all([
                    api.get('/purchases/invoices'),
                    api.get('/purchases/orders'),
                    api.get('/purchases/vendors')
                ]);
                setInvoices(invRes.data.data);
                setOrders(poRes.data.data);
                setVendors(venRes.data.data);
            }
        } catch (error) {
            console.error('Error fetching purchases data', error);
        } finally {
            setLoading(false);
        }
    };

    // --- Vendor Handlers ---
    const handleCreateVendor = async (e) => {
        e.preventDefault();
        try {
            await api.post('/purchases/vendors', vendorForm);
            setMsg('Vendor created successfully');
            setShowVendorModal(false);
            setVendorForm({ name: '', contact_name: '', email: '', phone: '', address: '' });
            fetchData();
        } catch (err) {
            alert('Error creating vendor');
        }
    };

    const handleDeleteVendor = async (id) => {
        if (!window.confirm("Delete vendor?")) return;
        try {
            await api.delete(`/purchases/vendors/${id}`);
            fetchData();
        } catch (err) {
            alert('Error deleting vendor');
        }
    }

    const openLedger = async (vendor) => {
        try {
            const res = await api.get(`/purchases/vendors/${vendor.id}/ledger`);
            setLedgerData({ ledger: res.data.data.ledger, balance: res.data.data.balance, vendorName: vendor.name, vendorId: vendor.id });
            setShowLedgerModal(true);
        } catch (err) {
            alert('Error fetching ledger');
        }
    };

    const handleRecordPayment = async (e) => {
        e.preventDefault();
        try {
            await api.post('/purchases/vendors/payment', { vendor_id: ledgerData.vendorId, amount: paymentForm.amount, reference: paymentForm.reference });
            setMsg('Payment recorded');
            setPaymentForm({ amount: '', reference: '' });
            openLedger({ id: ledgerData.vendorId, name: ledgerData.vendorName }); // refresh ledger internally
        } catch (err) {
            alert('Error recording payment');
        }
    };

    // --- Purchase Order Handlers ---
    const handleAddPoItem = () => {
        if (!poItem.product_id || poItem.quantity <= 0) return alert('Select product and valid quantity');
        const p = products.find(prod => prod.id === parseInt(poItem.product_id));
        if (p?.variants?.length > 0 && !poItem.variant_id) return alert('Select variant');

        let variantSku = '';
        if (poItem.variant_id) {
            const v = p.variants.find(v => v.id === parseInt(poItem.variant_id));
            variantSku = v?.variant_sku || '';
        }

        const newItem = {
            ...poItem,
            product_name: p.name,
            variant_sku: variantSku
        };
        setPoForm({ ...poForm, items: [...poForm.items, newItem] });
        setPoItem({ product_id: '', variant_id: '', quantity: 1, unit_price: 0 }); // reset
    };

    const handleCreatePO = async (e) => {
        e.preventDefault();
        if (poForm.items.length === 0) return alert('Add at least one item');
        try {
            await api.post('/purchases/orders', poForm);
            setMsg('Purchase order created successfully');
            setShowPOModal(false);
            setPoForm({ vendor_id: '', po_number: '', items: [] });
            fetchData();
        } catch (err) {
            alert('Error creating PO');
        }
    };

    // --- Receiving Handlers ---
    const openReceiveModal = (id) => {
        setReceiveForm({ po_id: id, warehouse_id: '' });
        setShowReceiveModal(true);
    };

    const handleReceivePO = async (e) => {
        e.preventDefault();
        if (!receiveForm.warehouse_id) return alert('Select a warehouse to receive stock into');
        try {
            await api.post(`/purchases/orders/${receiveForm.po_id}/receive`, { warehouse_id: receiveForm.warehouse_id });
            setMsg('Stock received and inventory updated');
            setShowReceiveModal(false);
            fetchData();
        } catch (err) {
            alert(err.response?.data?.message || 'Error receiving PO');
        }
    };

    // --- Invoice Handlers ---
    const handleCreateInvoice = async (e) => {
        e.preventDefault();
        try {
            // Find underlying PO to pass appropriate Vendor ID
            const po = orders.find(o => o.id === parseInt(invoiceForm.po_id));
            if (!po) return alert('Invalid Purchase Order selected');

            const payload = { ...invoiceForm, vendor_id: po.vendor_id };
            await api.post('/purchases/invoices', payload);

            setMsg('Purchase Invoice created. Vendor balance increased.');
            setShowInvoiceModal(false);
            setInvoiceForm({ po_id: '', vendor_id: '', invoice_number: '', total: 0, due_date: '' });
            fetchData();
        } catch (err) {
            alert('Error creating invoice');
        }
    };


    return (
        <div className="fade-in">
            {msg && <div style={{ padding: '0.75rem', backgroundColor: 'var(--success)', color: '#fff', borderRadius: '8px', marginBottom: '1rem' }}>{msg}</div>}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2>Purchase Management</h2>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                        className={`btn ${activeTab === 'orders' ? 'btn-primary' : ''}`}
                        onClick={() => setActiveTab('orders')}
                        style={{ backgroundColor: activeTab !== 'orders' ? 'var(--surface)' : '', color: activeTab !== 'orders' ? 'var(--text)' : '', border: '1px solid var(--border)' }}
                    >📋 Purchase Orders</button>
                    <button
                        className={`btn ${activeTab === 'invoices' ? 'btn-primary' : ''}`}
                        onClick={() => setActiveTab('invoices')}
                        style={{ backgroundColor: activeTab !== 'invoices' ? 'var(--surface)' : '', color: activeTab !== 'invoices' ? 'var(--text)' : '', border: '1px solid var(--border)' }}
                    >🧾 Invoices</button>
                    <button
                        className={`btn ${activeTab === 'vendors' ? 'btn-primary' : ''}`}
                        onClick={() => setActiveTab('vendors')}
                        style={{ backgroundColor: activeTab !== 'vendors' ? 'var(--surface)' : '', color: activeTab !== 'vendors' ? 'var(--text)' : '', border: '1px solid var(--border)' }}
                    >🚚 Vendors</button>
                </div>
            </div>

            {/* VENDORS TAB */}
            {activeTab === 'vendors' && (
                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3>Registered Vendors</h3>
                        <button className="btn btn-primary" onClick={() => setShowVendorModal(true)}>+ Add Vendor</button>
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
                                <th style={{ padding: '0.75rem' }}>Name</th>
                                <th style={{ padding: '0.75rem' }}>Contact</th>
                                <th style={{ padding: '0.75rem' }}>Email / Phone</th>
                                <th style={{ padding: '0.75rem', textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? <tr><td colSpan="4" style={{ padding: '1rem', textAlign: 'center' }}>Loading...</td></tr> :
                                vendors.map(v => (
                                    <tr key={v.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                        <td style={{ padding: '0.75rem', fontWeight: '500' }}>{v.name}</td>
                                        <td style={{ padding: '0.75rem' }}>{v.contact_name || '-'}</td>
                                        <td style={{ padding: '0.75rem' }}>
                                            {v.email && <div>{v.email}</div>}
                                            {v.phone && <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{v.phone}</div>}
                                            {!v.email && !v.phone && '-'}
                                        </td>
                                        <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                                            <button className="btn btn-primary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.85rem', marginRight: '0.5rem' }} onClick={() => openLedger(v)}>📒 Ledger</button>
                                            <button className="btn" style={{ padding: '0.25rem 0.5rem', color: 'var(--danger)', fontSize: '0.85rem' }} onClick={() => handleDeleteVendor(v.id)}>Delete</button>
                                        </td>
                                    </tr>
                                ))
                            }
                        </tbody>
                    </table>
                </div>
            )}

            {/* INVOICES TAB */}
            {activeTab === 'invoices' && (
                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3>Purchase Invoices</h3>
                        <button className="btn btn-primary" onClick={() => setShowInvoiceModal(true)}>+ Add Invoice</button>
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
                                <th style={{ padding: '0.75rem' }}>Invoice #</th>
                                <th style={{ padding: '0.75rem' }}>Vendor</th>
                                <th style={{ padding: '0.75rem' }}>Related PO #</th>
                                <th style={{ padding: '0.75rem' }}>Total</th>
                                <th style={{ padding: '0.75rem' }}>Due Date</th>
                                <th style={{ padding: '0.75rem' }}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? <tr><td colSpan="6" style={{ padding: '1rem', textAlign: 'center' }}>Loading...</td></tr> :
                                invoices.map(inv => (
                                    <tr key={inv.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                        <td style={{ padding: '0.75rem', fontWeight: '500' }}>{inv.invoice_number}</td>
                                        <td style={{ padding: '0.75rem' }}>{inv.vendor_name}</td>
                                        <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>{inv.po_number}</td>
                                        <td style={{ padding: '0.75rem' }}>${inv.total}</td>
                                        <td style={{ padding: '0.75rem' }}>{inv.due_date ? new Date(inv.due_date).toLocaleDateString() : 'N/A'}</td>
                                        <td style={{ padding: '0.75rem' }}>
                                            <span className={`badge badge-${inv.status === 'paid' ? 'active' : 'pending'}`} style={{ textTransform: 'capitalize' }}>{inv.status}</span>
                                        </td>
                                    </tr>
                                ))}
                            {invoices.length === 0 && !loading && (
                                <tr><td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No invoices found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* PURCHASE ORDERS TAB */}
            {activeTab === 'orders' && (
                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3>Purchase Orders</h3>
                        <button className="btn btn-primary" onClick={() => setShowPOModal(true)}>+ Create PO</button>
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
                                <th style={{ padding: '0.75rem' }}>PO Number</th>
                                <th style={{ padding: '0.75rem' }}>Vendor</th>
                                <th style={{ padding: '0.75rem' }}>Date</th>
                                <th style={{ padding: '0.75rem' }}>Amount</th>
                                <th style={{ padding: '0.75rem' }}>Status</th>
                                <th style={{ padding: '0.75rem', textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? <tr><td colSpan="6" style={{ padding: '1rem', textAlign: 'center' }}>Loading...</td></tr> :
                                orders.map(o => (
                                    <tr key={o.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                        <td style={{ padding: '0.75rem', fontWeight: '500' }}>{o.po_number}</td>
                                        <td style={{ padding: '0.75rem' }}>{o.vendor_name || 'Unknown'}</td>
                                        <td style={{ padding: '0.75rem' }}>{new Date(o.date).toLocaleDateString()}</td>
                                        <td style={{ padding: '0.75rem' }}>${o.total_amount}</td>
                                        <td style={{ padding: '0.75rem' }}>
                                            <span className={`badge badge-${o.status === 'received' ? 'active' : 'pending'}`} style={{ textTransform: 'capitalize' }}>{o.status}</span>
                                        </td>
                                        <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                                            {o.status !== 'received' && (
                                                <button className="btn btn-primary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.85rem' }} onClick={() => openReceiveModal(o.id)}>📥 Receive</button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            {orders.length === 0 && !loading && (
                                <tr><td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No purchase orders found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* VENDOR MODAL */}
            {showVendorModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                    <div className="card" style={{ width: '400px' }}>
                        <h3>Add Vendor</h3>
                        <form onSubmit={handleCreateVendor} style={{ marginTop: '1rem' }}>
                            <div className="form-group">
                                <label>Company Name *</label>
                                <input type="text" className="form-control" value={vendorForm.name} onChange={e => setVendorForm({ ...vendorForm, name: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label>Contact Person</label>
                                <input type="text" className="form-control" value={vendorForm.contact_name} onChange={e => setVendorForm({ ...vendorForm, contact_name: e.target.value })} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label>Email</label>
                                    <input type="email" className="form-control" value={vendorForm.email} onChange={e => setVendorForm({ ...vendorForm, email: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Phone</label>
                                    <input type="text" className="form-control" value={vendorForm.phone} onChange={e => setVendorForm({ ...vendorForm, phone: e.target.value })} />
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                                <button type="button" className="btn" onClick={() => setShowVendorModal(false)} style={{ flex: 1, backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>Cancel</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* CREATE PO MODAL */}
            {showPOModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                    <div className="card" style={{ width: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <h3>Create Purchase Order</h3>
                        <form onSubmit={handleCreatePO} style={{ marginTop: '1rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label>PO Number *</label>
                                    <input type="text" className="form-control" value={poForm.po_number} onChange={e => setPoForm({ ...poForm, po_number: e.target.value })} required placeholder="e.g. PO-2026-001" />
                                </div>
                                <div className="form-group">
                                    <label>Vendor *</label>
                                    <select className="form-control" value={poForm.vendor_id} onChange={e => setPoForm({ ...poForm, vendor_id: e.target.value })} required>
                                        <option value="">Select Vendor...</option>
                                        {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            <hr style={{ margin: '1.5rem 0', border: 'none', borderTop: '1px solid var(--border)' }} />
                            <h4>Items</h4>

                            <table style={{ width: '100%', marginBottom: '1rem', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: 'var(--bg)', textAlign: 'left' }}>
                                        <th style={{ padding: '0.5rem' }}>Product</th>
                                        <th style={{ padding: '0.5rem' }}>Variant</th>
                                        <th style={{ padding: '0.5rem' }}>Qty</th>
                                        <th style={{ padding: '0.5rem' }}>Cost</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {poForm.items.map((it, idx) => (
                                        <tr key={idx}>
                                            <td style={{ padding: '0.5rem' }}>{it.product_name}</td>
                                            <td style={{ padding: '0.5rem' }}>{it.variant_sku || '-'}</td>
                                            <td style={{ padding: '0.5rem' }}>{it.quantity}</td>
                                            <td style={{ padding: '0.5rem' }}>${it.unit_price}</td>
                                        </tr>
                                    ))}
                                    {poForm.items.length === 0 && <tr><td colSpan="4" style={{ padding: '0.5rem', color: 'var(--text-muted)' }}>No items added yet.</td></tr>}
                                </tbody>
                            </table>

                            {/* Add Item Form */}
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end', backgroundColor: 'var(--bg)', padding: '1rem', borderRadius: '8px' }}>
                                <div style={{ flex: 2 }}>
                                    <select className="form-control" value={poItem.product_id} onChange={e => setPoItem({ ...poItem, product_id: e.target.value, variant_id: '' })}>
                                        <option value="">Select Product</option>
                                        {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>
                                {products.find(p => p.id === parseInt(poItem.product_id))?.variants?.length > 0 && (
                                    <div style={{ flex: 1.5 }}>
                                        <select className="form-control" value={poItem.variant_id} onChange={e => setPoItem({ ...poItem, variant_id: e.target.value })}>
                                            <option value="">Select Variant</option>
                                            {products.find(p => p.id === parseInt(poItem.product_id)).variants.map(v => <option key={v.id} value={v.id}>{v.variant_sku}</option>)}
                                        </select>
                                    </div>
                                )}
                                <div style={{ flex: 1 }}>
                                    <input type="number" className="form-control" placeholder="Qty" min="1" value={poItem.quantity} onChange={e => setPoItem({ ...poItem, quantity: e.target.value })} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <input type="number" className="form-control" placeholder="$ Cost" min="0" step="0.01" value={poItem.unit_price} onChange={e => setPoItem({ ...poItem, unit_price: e.target.value })} />
                                </div>
                                <button type="button" className="btn btn-primary" onClick={handleAddPoItem}>Add</button>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                                <button type="button" className="btn" onClick={() => setShowPOModal(false)} style={{ flex: 1, backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>Cancel</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Submit PO</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* RECEIVE PO MODAL */}
            {showReceiveModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                    <div className="card" style={{ width: '400px' }}>
                        <h3>Receive Stock</h3>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Where should the items in this Purchase Order be delivered?</p>
                        <form onSubmit={handleReceivePO} style={{ marginTop: '1rem' }}>
                            <div className="form-group">
                                <label>Target Warehouse *</label>
                                <select className="form-control" value={receiveForm.warehouse_id} onChange={e => setReceiveForm({ ...receiveForm, warehouse_id: e.target.value })} required>
                                    <option value="">Select Warehouse...</option>
                                    {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                                </select>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                                <button type="button" className="btn" onClick={() => setShowReceiveModal(false)} style={{ flex: 1, backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>Cancel</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1, backgroundColor: 'var(--active)', color: 'white', border: 'none' }}>Confirm Receipt</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* CREATE INVOICE MODAL */}
            {showInvoiceModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                    <div className="card" style={{ width: '500px' }}>
                        <h3>Record Purchase Invoice</h3>
                        <form onSubmit={handleCreateInvoice} style={{ marginTop: '1rem' }}>
                            <div className="form-group">
                                <label>Related Purchase Order *</label>
                                <select className="form-control" value={invoiceForm.po_id} onChange={e => setInvoiceForm({ ...invoiceForm, po_id: e.target.value })} required>
                                    <option value="">Select PO...</option>
                                    {orders.map(o => <option key={o.id} value={o.id}>{o.po_number} ({o.vendor_name})</option>)}
                                </select>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label>Invoice Number *</label>
                                    <input type="text" className="form-control" value={invoiceForm.invoice_number} onChange={e => setInvoiceForm({ ...invoiceForm, invoice_number: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label>Total Amount *</label>
                                    <input type="number" className="form-control" step="0.01" value={invoiceForm.total} onChange={e => setInvoiceForm({ ...invoiceForm, total: e.target.value })} required />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Due Date</label>
                                <input type="date" className="form-control" value={invoiceForm.due_date} onChange={e => setInvoiceForm({ ...invoiceForm, due_date: e.target.value })} />
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                                <button type="button" className="btn" onClick={() => setShowInvoiceModal(false)} style={{ flex: 1, backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>Cancel</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save Invoice</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* VENDOR LEDGER MODAL */}
            {showLedgerModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                    <div className="card" style={{ width: '800px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                            <div>
                                <h3>{ledgerData.vendorName} - Ledger</h3>
                                <p style={{ fontSize: '1.1rem', marginTop: '0.5rem' }}>Current Balance: <span style={{ fontWeight: 'bold', color: ledgerData.balance > 0 ? 'var(--danger)' : 'var(--success)' }}>${ledgerData.balance?.toFixed(2)}</span></p>
                                <small style={{ color: 'var(--text-muted)' }}>(Positive balance means you owe the vendor)</small>
                            </div>
                            <button className="btn" onClick={() => setShowLedgerModal(false)}>Close</button>
                        </div>

                        {/* Payment Entry Form */}
                        <div style={{ backgroundColor: 'var(--bg)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
                            <h4 style={{ marginBottom: '0.5rem' }}>Record Payment Sent to Vendor</h4>
                            <form onSubmit={handleRecordPayment} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ fontSize: '0.85rem' }}>Amount Paid *</label>
                                    <input type="number" className="form-control" step="0.01" min="0.01" required value={paymentForm.amount} onChange={e => setPaymentForm({ ...paymentForm, amount: e.target.value })} />
                                </div>
                                <div style={{ flex: 2 }}>
                                    <label style={{ fontSize: '0.85rem' }}>Reference (Cheque #, Transaction ID) *</label>
                                    <input type="text" className="form-control" required value={paymentForm.reference} onChange={e => setPaymentForm({ ...paymentForm, reference: e.target.value })} />
                                </div>
                                <button type="submit" className="btn btn-primary">Record Payment</button>
                            </form>
                        </div>

                        {/* Ledger Table */}
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
                                    <th style={{ padding: '0.75rem' }}>Date</th>
                                    <th style={{ padding: '0.75rem' }}>Reference</th>
                                    <th style={{ padding: '0.75rem', textAlign: 'right' }}>Debit (Invoice)</th>
                                    <th style={{ padding: '0.75rem', textAlign: 'right' }}>Credit (Payment)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {ledgerData.ledger.map(entry => (
                                    <tr key={entry.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                        <td style={{ padding: '0.75rem' }}>{new Date(entry.date).toLocaleString()}</td>
                                        <td style={{ padding: '0.75rem' }}>{entry.reference}</td>
                                        <td style={{ padding: '0.75rem', textAlign: 'right', color: 'var(--danger)' }}>{entry.type === 'dr' ? `$${entry.amount}` : '-'}</td>
                                        <td style={{ padding: '0.75rem', textAlign: 'right', color: 'var(--success)' }}>{entry.type === 'cr' ? `$${entry.amount}` : '-'}</td>
                                    </tr>
                                ))}
                                {ledgerData.ledger.length === 0 && (
                                    <tr><td colSpan="4" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No ledger entries found.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Purchases;
