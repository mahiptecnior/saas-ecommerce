import React, { useState, useEffect } from 'react';
import api from '../api/axios';

const Orders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchOrders();
    }, []);

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

    const generateInvoice = (orderId) => {
        alert(`Generating invoice for Order #${orderId}... (PDF Download Mocked)`);
        // In a real app, this would hit /api/v1/orders/:id/invoice
    };

    if (loading) return <div>Loading orders...</div>;

    const statusFlow = ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'];

    return (
        <div className="fade-in">
            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2>Sales & Orders</h2>
                    <span className="text-muted">{orders.length} total orders</span>
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
        </div>
    );
};

export default Orders;
