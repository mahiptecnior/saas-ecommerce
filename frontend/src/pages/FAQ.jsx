import React, { useState, useEffect } from 'react';
import api from '../api/axios';

const FAQ = () => {
    const [faqs, setFaqs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ question: '', answer: '', category: '', display_order: 0 });

    useEffect(() => {
        fetchFAQs();
    }, []);

    const fetchFAQs = async () => {
        setLoading(true);
        try {
            const res = await api.get('/marketing-v2/faqs');
            setFaqs(res.data.data);
        } catch (err) {
            console.error('Error fetching FAQs', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateFAQ = async (e) => {
        e.preventDefault();
        try {
            await api.post('/marketing-v2/faqs', form);
            alert('FAQ created!');
            setShowModal(false);
            setForm({ question: '', answer: '', category: '', display_order: 0 });
            fetchFAQs();
        } catch (err) {
            alert('Error creating FAQ');
        }
    };

    if (loading) return <div className="fade-in">Loading FAQs...</div>;

    return (
        <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1>Knowledge Base / FAQ</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Manage questions and answers for your customers.</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Add New FAQ</button>
            </div>

            <div className="card">
                <table className="table">
                    <thead>
                        <tr>
                            <th style={{ width: '50px' }}>#</th>
                            <th>Category</th>
                            <th>Question</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {faqs.map(faq => (
                            <tr key={faq.id}>
                                <td>{faq.display_order}</td>
                                <td><span className="badge badge-outline" style={{ fontSize: '0.75rem', padding: '2px 8px' }}>{faq.category || 'General'}</span></td>
                                <td style={{ fontWeight: '600' }}>{faq.question}</td>
                                <td>{faq.is_published ? '🟢 Published' : '⚪ Draft'}</td>
                            </tr>
                        ))}
                        {faqs.length === 0 && <tr><td colSpan="4" style={{ textAlign: 'center', padding: '2rem' }}>No FAQs found.</td></tr>}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                    <div className="card" style={{ width: '600px' }}>
                        <h3>Add New FAQ Item</h3>
                        <form onSubmit={handleCreateFAQ} style={{ marginTop: '1.5rem' }}>
                            <div className="form-group">
                                <label>Category</label>
                                <input type="text" className="form-control" placeholder="e.g. Shipping, Returns" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>Question *</label>
                                <input type="text" className="form-control" value={form.question} onChange={e => setForm({ ...form, question: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label>Answer *</label>
                                <textarea className="form-control" style={{ minHeight: '120px' }} value={form.answer} onChange={e => setForm({ ...form, answer: e.target.value })} required></textarea>
                            </div>
                            <div className="form-group">
                                <label>Display Order</label>
                                <input type="number" className="form-control" value={form.display_order} onChange={e => setForm({ ...form, display_order: e.target.value })} />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                                <button type="button" className="btn" onClick={() => setShowModal(false)} style={{ flex: 1 }}>Cancel</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save FAQ</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FAQ;
