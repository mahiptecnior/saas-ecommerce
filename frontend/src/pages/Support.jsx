import React, { useState, useEffect } from 'react';
import api from '../api/axios';

const Support = () => {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ subject: '', message: '', priority: 'medium' });
    const [msg, setMsg] = useState('');

    useEffect(() => { fetchTickets(); }, []);

    const fetchTickets = async () => {
        setLoading(true);
        try {
            const res = await api.get('/modules/support/tickets');
            setTickets(res.data.data);
        } catch (error) {
            console.error('Error fetching tickets', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await api.post('/modules/support/tickets', form);
            setForm({ subject: '', message: '', priority: 'medium' });
            setShowModal(false);
            setMsg('Ticket created successfully!');
            fetchTickets();
            setTimeout(() => setMsg(''), 3000);
        } catch (err) { alert('Error creating ticket'); }
    };

    const priorityColor = (p) => {
        const colors = { high: { bg: '#fee2e2', text: '#991b1b' }, medium: { bg: '#fef3c7', text: '#92400e' }, low: { bg: '#d1fae5', text: '#065f46' } };
        return colors[p] || colors.medium;
    };

    return (
        <div className="fade-in">
            {msg && <div style={{ padding: '0.75rem', backgroundColor: 'var(--success)', color: '#fff', borderRadius: '8px', marginBottom: '1rem' }}>{msg}</div>}

            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <div>
                        <h2>Support Tickets</h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{tickets.length} total tickets</p>
                    </div>
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Open New Ticket</button>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
                            <th style={{ padding: '0.75rem' }}>ID</th>
                            <th style={{ padding: '0.75rem' }}>Subject</th>
                            <th style={{ padding: '0.75rem' }}>Priority</th>
                            <th style={{ padding: '0.75rem' }}>Status</th>
                            <th style={{ padding: '0.75rem' }}>Created</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</td></tr>
                        ) : tickets.length === 0 ? (
                            <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No support tickets found.</td></tr>
                        ) : tickets.map(ticket => (
                            <tr key={ticket.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                <td style={{ padding: '0.75rem', fontFamily: 'monospace' }}>#{ticket.id}</td>
                                <td style={{ padding: '0.75rem', fontWeight: '500' }}>{ticket.subject}</td>
                                <td style={{ padding: '0.75rem' }}>
                                    <span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600', backgroundColor: priorityColor(ticket.priority).bg, color: priorityColor(ticket.priority).text }}>
                                        {(ticket.priority || 'medium').toUpperCase()}
                                    </span>
                                </td>
                                <td style={{ padding: '0.75rem' }}>
                                    <span className={`badge badge-${ticket.status === 'open' ? 'active' : 'suspended'}`}>
                                        {(ticket.status || 'open').replace('_', ' ')}
                                    </span>
                                </td>
                                <td style={{ padding: '0.75rem', fontSize: '0.85rem' }}>{new Date(ticket.created_at).toLocaleDateString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* CREATE TICKET MODAL */}
            {showModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="card" style={{ width: '500px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <h3>Open New Ticket</h3>
                            <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem' }}>&times;</button>
                        </div>
                        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.3rem' }}>Subject</label>
                                <input className="input-field" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} required placeholder="Brief description of your issue" />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.3rem' }}>Priority</label>
                                <select className="input-field" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.3rem' }}>Message</label>
                                <textarea className="input-field" rows="4" value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} required placeholder="Describe your issue in detail..." />
                            </div>
                            <button type="submit" className="btn btn-primary">Submit Ticket</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Support;
