import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';

const Orders = () => {
    const [activeTab, setActiveTab] = useState('orders');
    const [orders, setOrders] = useState([]);
    const [documents, setDocuments] = useState([]);
    const [recurring, setRecurring] = useState([]);
    const [loading, setLoading] = useState(true);

    // Document & Recurring Modal State
    const [showDocModal, setShowDocModal] = useState(false);
    const [docForm, setDocForm] = useState({ order_id: '', customer_id: '', document_type: 'proforma', document_number: '', total_amount: '', due_date: '', notes: '' });

    const [showRecurringModal, setShowRecurringModal] = useState(false);
    const [recurringForm, setRecurringForm] = useState({ customer_id: '', name: '', frequency: 'monthly', amount: '', next_invoice_date: '' });

    // Limits & Upgrades
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [limitMsg, setLimitMsg] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'orders') {
                const { data } = await api.get('/orders');
                setOrders(data.data);
            } else if (activeTab === 'documents') {
                const { data } = await api.get('/orders/docs');
                setDocuments(data.data);
            } else if (activeTab === 'recurring') {
                const { data } = await api.get('/orders/recurring');
                setRecurring(data.data);
            }
        } catch (err) {
            console.error('Error fetching data', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateMockOrder = async () => {
        try {
            await api.post('/orders', {
                customer_id: 1,
                total_amount: '99.99',
                items: [{ product_id: 1, quantity: 1, unit_price: '99.99' }]
            });
            fetchData();
            alert('Mock Order created successfully!');
        } catch (error) {
            if (error.response && error.response.status === 403 && error.response.data.errorCode === 'LIMIT_REACHED') {
                setLimitMsg(error.response.data.message);
                setShowUpgradeModal(true);
            } else {
                console.error('Error creating order', error);
                alert('Failed to create mock order.');
            }
        }
    };

    const handleRefund = async (id) => {
        if (window.confirm('Are you sure you want to refund this order?')) {
            try {
                await api.put(`/orders/${id}/status`, { status: 'cancelled' });
                fetchData();
                alert('Refund processed and order cancelled.');
            } catch (err) {
                alert('Error processing refund');
            }
        }
    };

    const handleStatusUpdate = async (id, status) => {
        try {
            await api.put(`/orders/${id}/status`, { status });
            fetchData();
        } catch (err) {
            alert('Error updating order status');
        }
    };

    const generateInvoice = async (orderId) => {
        try {
            const response = await api.get(`/orders/${orderId}/invoice`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Invoice-Order-${orderId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Error downloading invoice:', error);
            alert('Failed to generate invoice. Please try again.');
        }
    };

    const openDocModal = (order) => {
        setDocForm({
            order_id: order.id,
            customer_id: order.customer_id || '',
            document_type: 'proforma',
            document_number: `DOC-${Date.now().toString(36).toUpperCase()}`,
            total_amount: order.total_amount,
            due_date: '',
            notes: ''
        });
        setShowDocModal(true);
    };

    const handleCreateDocument = async (e) => {
        e.preventDefault();
        try {
            await api.post('/orders/docs', docForm);
            alert(`${docForm.document_type.toUpperCase()} created successfully!`);
            setShowDocModal(false);
            if (activeTab === 'documents') fetchData();
            else setActiveTab('documents');
        } catch (error) {
            alert('Failed to create document.');
        }
    };

    const handleCreateRecurring = async (e) => {
        e.preventDefault();
        try {
            await api.post('/orders/recurring', recurringForm);
            alert('Recurring invoice profile created successfully!');
            setShowRecurringModal(false);
            fetchData();
        } catch (error) {
            alert('Failed to create recurring invoice.');
        }
    };

    const handleToggleRecurringStatus = async (id, currentStatus) => {
        const newStatus = currentStatus === 'active' ? 'paused' : 'active';
        try {
            await api.put(`/orders/recurring/${id}/status`, { status: newStatus });
            fetchData();
        } catch (err) {
            alert('Failed to update recurring invoice status.');
        }
    };

    const statusFlow = ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'];

    if (loading) return <div className="fade-in">Loading...</div>;

    return (
        <div className="fade-in">
            {/* Tabs */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)' }}>
                <button
                    className={`btn ${activeTab === 'orders' ? 'btn-primary' : ''}`}
                    style={{ backgroundColor: activeTab === 'orders' ? 'var(--primary)' : 'transparent', color: activeTab === 'orders' ? 'white' : 'var(--text)', border: 'none', borderRadius: '4px 4px 0 0', padding: '0.75rem 1.5rem' }}
                    onClick={() => setActiveTab('orders')}
                >
                    Orders
                </button>
                <button
                    className={`btn ${activeTab === 'documents' ? 'btn-primary' : ''}`}
                    style={{ backgroundColor: activeTab === 'documents' ? 'var(--primary)' : 'transparent', color: activeTab === 'documents' ? 'white' : 'var(--text)', border: 'none', borderRadius: '4px 4px 0 0', padding: '0.75rem 1.5rem' }}
                    onClick={() => setActiveTab('documents')}
                >
                    Billing Documents
                </button>
                <button
                    className={`btn ${activeTab === 'recurring' ? 'btn-primary' : ''}`}
                    style={{ backgroundColor: activeTab === 'recurring' ? 'var(--primary)' : 'transparent', color: activeTab === 'recurring' ? 'white' : 'var(--text)', border: 'none', borderRadius: '4px 4px 0 0', padding: '0.75rem 1.5rem' }}
                    onClick={() => setActiveTab('recurring')}
                >
                    Recurring Invoices
                </button>
            </div>

            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <div>
                        <h2>{activeTab === 'orders' ? 'Sales & Orders' : activeTab === 'documents' ? 'Billing Documents' : 'Recurring Invoices'}</h2>
                    </div>
                    {activeTab === 'orders' && (
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button className="btn btn-primary" onClick={() => navigate('/dashboard/pos')} style={{ backgroundColor: 'var(--success)', border: 'none', color: 'white' }}>+ New Manual Order (POS)</button>
                            <button className="btn btn-primary" onClick={handleCreateMockOrder}>Mock New Order</button>
                        </div>
                    )}
                    {activeTab === 'recurring' && (
                        <button className="btn btn-primary" onClick={() => setShowRecurringModal(true)}>+ New Profile</button>
                    )}
                </div>

                {/* Orders Tab */}
                {activeTab === 'orders' && (
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Order ID</th>
                                <th>Source</th>
                                <th>Customer</th>
                                <th>Total</th>
                                <th>Status</th>
                                <th>Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map(order => (
                                <tr key={order.id}>
                                    <td>#{order.id}</td>
                                    <td><span style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem', backgroundColor: 'var(--surface)', borderRadius: '4px', border: '1px solid var(--border)' }}>{order.source?.toUpperCase() || 'WEB'}</span></td>
                                    <td>{order.customer_id || 'Guest'}</td>
                                    <td style={{ fontWeight: '600' }}>${order.total_amount}</td>
                                    <td>
                                        <span className={`status-badge status-${order.status}`}>
                                            {order.status}
                                        </span>
                                    </td>
                                    <td>{new Date(order.created_at).toLocaleDateString()}</td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <select value={order.status} onChange={(e) => handleStatusUpdate(order.id, e.target.value)} style={{ padding: '0.25rem', borderRadius: '4px', border: '1px solid var(--border)' }}>
                                                {statusFlow.map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                                            </select>
                                            <button className="btn" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={() => generateInvoice(order.id)}>Receipt</button>
                                            <button className="btn btn-outline" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={() => openDocModal(order)}>Issue Doc</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {orders.length === 0 && <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>No orders found.</td></tr>}
                        </tbody>
                    </table>
                )}

                {/* Documents Tab */}
                {activeTab === 'documents' && (
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Doc #</th>
                                <th>Type</th>
                                <th>Order Ref</th>
                                <th>Customer</th>
                                <th>Total</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {documents.map(doc => (
                                <tr key={doc.id}>
                                    <td style={{ fontWeight: 'bold' }}>{doc.document_number}</td>
                                    <td><span style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem', backgroundColor: 'var(--surface)', borderRadius: '4px', border: '1px solid var(--border)' }}>{doc.document_type.replace('_', ' ').toUpperCase()}</span></td>
                                    <td>{doc.order_ref ? `#${doc.order_ref}` : 'N/A'}</td>
                                    <td>{doc.customer_name || `ID: ${doc.customer_id}`}</td>
                                    <td style={{ fontWeight: '600' }}>${doc.total_amount}</td>
                                    <td>{new Date(doc.created_at).toLocaleDateString()}</td>
                                </tr>
                            ))}
                            {documents.length === 0 && <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>No billing documents found.</td></tr>}
                        </tbody>
                    </table>
                )}

                {/* Recurring Invoices Tab */}
                {activeTab === 'recurring' && (
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Profile Name</th>
                                <th>Customer</th>
                                <th>Frequency</th>
                                <th>Amount</th>
                                <th>Next Invoice</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recurring.map(rec => (
                                <tr key={rec.id}>
                                    <td style={{ fontWeight: 'bold' }}>{rec.name}</td>
                                    <td>{rec.customer_name || `ID: ${rec.customer_id}`}</td>
                                    <td><span style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem', backgroundColor: 'var(--surface)', borderRadius: '4px', border: '1px solid var(--border)', textTransform: 'capitalize' }}>{rec.frequency}</span></td>
                                    <td style={{ fontWeight: '600' }}>${rec.amount}</td>
                                    <td>{new Date(rec.next_invoice_date).toLocaleDateString()}</td>
                                    <td>
                                        <span className={`badge ${rec.status === 'active' ? 'badge-success' : 'badge-warning'}`} style={{
                                            padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem',
                                            backgroundColor: rec.status === 'active' ? '#def7ec' : '#fef3c7',
                                            color: rec.status === 'active' ? '#03543f' : '#92400e'
                                        }}>
                                            {rec.status.toUpperCase()}
                                        </span>
                                    </td>
                                    <td>
                                        <button
                                            className="btn btn-sm"
                                            style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
                                            onClick={() => handleToggleRecurringStatus(rec.id, rec.status)}
                                        >
                                            {rec.status === 'active' ? 'Pause' : 'Activate'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {recurring.length === 0 && <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>No recurring profiles found.</td></tr>}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Create Document Modal */}
            {showDocModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                    <div className="card" style={{ width: '450px' }}>
                        <h3>Issue Billing Document</h3>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Generate a Proforma Invoice, Credit Note, or Debit Note for Order #{docForm.order_id}</p>
                        <form onSubmit={handleCreateDocument} style={{ marginTop: '1rem' }}>
                            <div className="form-group">
                                <label>Document Type *</label>
                                <select className="form-control" value={docForm.document_type} onChange={e => setDocForm({ ...docForm, document_type: e.target.value })}>
                                    <option value="proforma">Proforma Invoice</option>
                                    <option value="credit_note">Credit Note (Refund)</option>
                                    <option value="debit_note">Debit Note (Charge)</option>
                                </select>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label>Doc Number *</label>
                                    <input type="text" className="form-control" value={docForm.document_number} onChange={e => setDocForm({ ...docForm, document_number: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label>Amount *</label>
                                    <input type="number" step="0.01" className="form-control" value={docForm.total_amount} onChange={e => setDocForm({ ...docForm, total_amount: e.target.value })} required />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Due Date / Expiry</label>
                                <input type="date" className="form-control" value={docForm.due_date} onChange={e => setDocForm({ ...docForm, due_date: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>Notes</label>
                                <textarea className="form-control" rows="2" value={docForm.notes} onChange={e => setDocForm({ ...docForm, notes: e.target.value })} placeholder="Reason for credit/debit, payment terms, etc."></textarea>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                                <button type="button" className="btn" onClick={() => setShowDocModal(false)} style={{ flex: 1 }}>Cancel</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save Document</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Create Recurring Profile Modal */}
            {showRecurringModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                    <div className="card" style={{ width: '450px' }}>
                        <h3>New Recurring Invoice</h3>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Set up automated billing intervals for subscriptions or retainers.</p>
                        <form onSubmit={handleCreateRecurring} style={{ marginTop: '1rem' }}>
                            <div className="form-group">
                                <label>Profile Name *</label>
                                <input type="text" className="form-control" placeholder="e.g. Monthly Retainer" value={recurringForm.name} onChange={e => setRecurringForm({ ...recurringForm, name: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label>Customer ID *</label>
                                <input type="number" className="form-control" value={recurringForm.customer_id} onChange={e => setRecurringForm({ ...recurringForm, customer_id: e.target.value })} required />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label>Amount *</label>
                                    <input type="number" step="0.01" className="form-control" value={recurringForm.amount} onChange={e => setRecurringForm({ ...recurringForm, amount: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label>Frequency *</label>
                                    <select className="form-control" value={recurringForm.frequency} onChange={e => setRecurringForm({ ...recurringForm, frequency: e.target.value })} required>
                                        <option value="weekly">Weekly</option>
                                        <option value="monthly">Monthly</option>
                                        <option value="yearly">Yearly</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>First Invoice Date *</label>
                                <input type="date" className="form-control" value={recurringForm.next_invoice_date} onChange={e => setRecurringForm({ ...recurringForm, next_invoice_date: e.target.value })} required />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                                <button type="button" className="btn" onClick={() => setShowRecurringModal(false)} style={{ flex: 1 }}>Cancel</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save Profile</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Upgrade Plan Modal */}
            {showUpgradeModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100, backdropFilter: 'blur(3px)' }}>
                    <div className="card animate-fade-in" style={{ width: '450px', textAlign: 'center', padding: '2rem' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔒</div>
                        <h3 style={{ marginBottom: '1rem', color: 'var(--text)' }}>Limit Reached</h3>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', lineHeight: '1.5' }}>
                            {limitMsg || "You have reached the maximum allowance for your current subscription plan."}
                        </p>
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                            <button type="button" className="btn btn-outline" onClick={() => setShowUpgradeModal(false)}>Close</button>
                            <button type="button" className="btn btn-primary" onClick={() => navigate('/tenant/billing')}>Upgrade Plan</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Orders;
