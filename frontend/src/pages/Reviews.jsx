import React, { useState, useEffect } from 'react';
import api from '../api/axios';

const Reviews = () => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchReviews();
    }, []);

    const fetchReviews = async () => {
        try {
            const res = await api.get('/reviews');
            setReviews(res.data.data);
        } catch (error) {
            console.error('Error fetching reviews', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (id, status) => {
        try {
            await api.patch(`/reviews/${id}/status`, { status });
            fetchReviews();
        } catch (error) {
            console.error('Error updating review status', error);
            alert('Error updating review status');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this review?')) return;
        try {
            await api.delete(`/reviews/${id}`);
            fetchReviews();
        } catch (error) {
            console.error('Error deleting review', error);
            alert('Error deleting review');
        }
    };

    if (loading) return <div className="fade-in">Loading reviews...</div>;

    const getStatusStyle = (status) => {
        switch (status) {
            case 'approved': return { backgroundColor: '#def7ec', color: '#03543f' };
            case 'rejected': return { backgroundColor: '#fde8e8', color: '#9b1c1c' };
            default: return { backgroundColor: '#fef3c7', color: '#92400e' }; // pending
        }
    };

    return (
        <div className="fade-in">
            <div style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-main)' }}>Product Reviews</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Moderate customer reviews and feedback.</p>
            </div>

            <div className="card">
                <table className="table">
                    <thead>
                        <tr>
                            <th>Product</th>
                            <th>Customer</th>
                            <th>Rating</th>
                            <th>Comment</th>
                            <th>Status</th>
                            <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {reviews.length === 0 ? (
                            <tr>
                                <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No reviews found.</td>
                            </tr>
                        ) : (
                            reviews.map(review => (
                                <tr key={review.id}>
                                    <td style={{ fontWeight: '500' }}>{review.product_name}</td>
                                    <td>
                                        <div>{review.customer_name}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{review.customer_email}</div>
                                    </td>
                                    <td>
                                        <div style={{ color: '#fbbf24' }}>
                                            {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                                        </div>
                                    </td>
                                    <td style={{ maxWidth: '300px', fontSize: '0.9rem' }}>
                                        <div style={{ fontStyle: 'italic' }}>"{review.comment}"</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>{new Date(review.created_at).toLocaleDateString()}</div>
                                    </td>
                                    <td>
                                        <span className="badge" style={{
                                            padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem',
                                            textTransform: 'capitalize',
                                            ...getStatusStyle(review.status)
                                        }}>
                                            {review.status}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '5px', justifyContent: 'flex-end' }}>
                                            {review.status !== 'approved' && (
                                                <button className="btn btn-sm" style={{ backgroundColor: '#def7ec', color: '#03543f' }} onClick={() => handleStatusUpdate(review.id, 'approved')}>Approve</button>
                                            )}
                                            {review.status !== 'rejected' && (
                                                <button className="btn btn-sm" style={{ backgroundColor: '#fde8e8', color: '#9b1c1c' }} onClick={() => handleStatusUpdate(review.id, 'rejected')}>Reject</button>
                                            )}
                                            <button className="btn btn-sm" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }} onClick={() => handleDelete(review.id)}>Delete</button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Reviews;
