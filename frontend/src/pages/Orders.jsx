import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';

const Orders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    // Limits & Upgrades
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [limitMsg, setLimitMsg] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        fetchOrders();
    }, []);

    const handleCreateMockOrder = async () => {
        try {
            await api.post('/orders', {
                customer_id: 1,
                total_amount: '99.99',
                items: [{ product_id: 1, quantity: 1, unit_price: '99.99' }]
            });
            fetchOrders();
            alert('Mock Order created successfully!');
        } catch (error) {
            if (error.response && error.response.status === 403 && error.response.data.errorCode === 'LIMIT_REACHED') {
                setLimitMsg(error.response.data.message);
                setShowUpgradeModal(true);
            } else {
                console.error('Error creating order', error);
                alert('Failed to create mock order. Ensure a product exists with ID 1.');
            }
        }
    };

    const handleRefund = async (id) => {
        if (window.confirm('Are you sure you want to refund this order?')) {
            try {
                await api.put(`/orders/${id}/status`, { status: 'cancelled' });
                fetchOrders();
                alert('Refund processed and order cancelled.');
            } catch (err) {
                alert('Error processing refund');
            }
        }
    };

    const fetchOrders = async () => {
        try {
            const { data } = await api.get('/orders');
            setOrders(data.data);
        } catch (err) {
            console.error('Error fetching orders', err);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (id, status) => {
        try {
            await api.put(`/orders/${id}/status`, { status });
            fetchOrders();
        } catch (err) {
            alert('Error updating order status');
        }
    };

    const generateInvoice = async (orderId) => {
        try {
            // Trigger download from backend
            const response = await api.get(`/orders/${orderId}/invoice`, {
                responseType: 'blob', // Important for handling PDF files
            });

            // Create a link to download the file
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

    if (loading) return <div>Loading orders...</div>;

    const statusFlow = ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'];

    return (
        <div className="fade-in">
            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <div>
                        <h2>Sales & Orders</h2>
                        <span className="text-muted">{orders.length} total orders</span>
                    </div>
                    <button className="btn btn-primary" onClick={handleCreateMockOrder}>Mock New Order (Test Limits)</button>
                </div>

                <table className="table">
                    <thead>
                        <tr>
                            <th>Order ID</th>
                            <th>Customer</th>
                            <th>Total Amount</th>
                            <th>Status</th>
                            <th>Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map(order => (
                            <tr key={order.id}>
                                <td>#{order.id}</td>
                                <td>Customer {order.customer_id || 'Guest'}</td>
                                <td style={{ fontWeight: '600' }}>${order.total_amount}</td>
                                <td>
                                    <span className={`status-badge status-${order.status}`}>
                                        {order.status}
                                    </span>
                                </td>
                                <td>{new Date(order.created_at).toLocaleDateString()}</td>
                                <td>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <select
                                            value={order.status}
                                            onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                                            style={{ padding: '0.25rem', borderRadius: '4px', border: '1px solid var(--border)' }}
                                        >
                                            {statusFlow.map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                                        </select>
                                        <button
                                            className="btn"
                                            style={{ backgroundColor: 'var(--error)', padding: '0.25rem 0.5rem', fontSize: '0.75rem', color: '#fff' }}
                                            onClick={() => handleRefund(order.id)}
                                        >
                                            Refund
                                        </button>
                                        <button
                                            className="btn"
                                            style={{ backgroundColor: 'var(--background)', padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                                            onClick={() => generateInvoice(order.id)}
                                        >
                                            Invoice
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {orders.length === 0 && (
                            <tr>
                                <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                                    No orders found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Upgrade Plan Modal */}
            {showUpgradeModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100, backdropFilter: 'blur(3px)'
                }}>
                    <div className="card animate-fade-in" style={{ width: '450px', textAlign: 'center', padding: '2rem' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔒</div>
                        <h3 style={{ marginBottom: '1rem', color: 'var(--text)' }}>Limit Reached</h3>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', lineHeight: '1.5' }}>
                            {limitMsg || "You have reached the maximum allowance for your current subscription plan."}
                        </p>
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                            <button type="button" className="btn btn-outline" onClick={() => setShowUpgradeModal(false)}>Close</button>
                            <button type="button" className="btn btn-primary" onClick={() => navigate('/tenant/billing')}>
                                Upgrade Plan
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Orders;
