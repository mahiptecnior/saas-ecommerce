import React, { useState, useEffect } from 'react';
import api from '../api/axios';

const priorityColor = (p) => {
    const colors = { high: { bg: '#fee2e2', text: '#991b1b' }, medium: { bg: '#fef3c7', text: '#92400e' }, low: { bg: '#d1fae5', text: '#065f46' } };
    return colors[p] || colors.medium;
};

const statusColor = (s) => {
    const colors = { open: 'badge-active', answered: 'badge-pending', closed: 'badge-suspended' };
    return colors[s] || 'badge-active';
};

const Support = () => {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [replies, setReplies] = useState([]);
    const [replyText, setReplyText] = useState('');
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

    const openTicket = async (ticket) => {
        setSelectedTicket(ticket);
        try {
            const res = await api.get(`/modules/support/tickets/${ticket.id}/replies`);
            setReplies(res.data.data || []);
        } catch (err) { setReplies([]); }
    };

    const handleReply = async (e) => {
        e.preventDefault();
        if (!replyText.trim()) return;
        try {
            await api.post(`/modules/support/tickets/${selectedTicket.id}/replies`, { message: replyText, is_admin: false });
            setReplyText('');
            const res = await api.get(`/modules/support/tickets/${selectedTicket.id}/replies`);
            setReplies(res.data.data || []);
            fetchTickets();
        } catch (err) { alert('Error adding reply'); }
    };

    const handleCloseTicket = async () => {
        try {
            await api.patch(`/modules/support/tickets/${selectedTicket.id}/status`, { status: 'closed' });
            setSelectedTicket({ ...selectedTicket, status: 'closed' });
            fetchTickets();
        } catch (err) { alert('Error closing ticket'); }
    };

    if (selectedTicket) {
        return (
            <div className="fade-in">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                    <button className="btn" onClick={() => { setSelectedTicket(null); setReplies([]); }} style={{ padding: '0.5rem 1rem' }}>← Back</button>
                    <h2>Ticket #{selectedTicket.id}: {selectedTicket.subject}</h2>
                    <span className={`badge ${statusColor(selectedTicket.status)}`}>{selectedTicket.status}</span>
                    {selectedTicket.status !== 'closed' && (
                        <button className="btn" onClick={handleCloseTicket} style={{ marginLeft: 'auto', backgroundColor: 'var(--danger)', color: '#fff', padding: '0.4rem 1rem' }}>Close Ticket</button>
                    )}
                </div>

                {/* Original message */}
                <div className="card" style={{ marginBottom: '1rem', borderLeft: '4px solid var(--primary)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <strong>Your Message</strong>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(selectedTicket.created_at).toLocaleString()}</span>
                    </div>
                    <p style={{ whiteSpace: 'pre-wrap' }}>{selectedTicket.message}</p>
                </div>

                {/* Replies */}
                {replies.map(reply => (
                    <div key={reply.id} className="card" style={{ marginBottom: '1rem', borderLeft: `4px solid ${reply.is_admin ? 'var(--success)' : 'var(--primary)'}`, marginLeft: reply.is_admin ? '0' : '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <strong style={{ color: reply.is_admin ? 'var(--success)' : 'var(--primary)' }}>{reply.is_admin ? '🛡️ Support Team' : '👤 You'}</strong>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(reply.created_at).toLocaleString()}</span>
                        </div>
                        <p style={{ whiteSpace: 'pre-wrap' }}>{reply.message}</p>
                    </div>
                ))}

                {selectedTicket.status !== 'closed' && (
                    <div className="card">
                        <h4 style={{ marginBottom: '1rem' }}>Add Reply</h4>
                        <form onSubmit={handleReply} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <textarea className="form-control" rows="4" value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Write your response..." required />
                            <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-end' }}>Send Reply</button>
                        </form>
                    </div>
                )}
            </div>
        );
    }

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
                            <th style={{ padding: '0.75rem' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</td></tr>
                        ) : tickets.length === 0 ? (
                            <tr><td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No support tickets found.</td></tr>
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
                                    <span className={`badge ${statusColor(ticket.status)}`}>{(ticket.status || 'open').replace('_', ' ')}</span>
                                </td>
                                <td style={{ padding: '0.75rem', fontSize: '0.85rem' }}>{new Date(ticket.created_at).toLocaleDateString()}</td>
                                <td style={{ padding: '0.75rem' }}>
                                    <button className="btn btn-sm" onClick={() => openTicket(ticket)} style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem', backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>View</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

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
                                <input className="form-control" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} required placeholder="Brief description of your issue" />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.3rem' }}>Priority</label>
                                <select className="form-control" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.3rem' }}>Message</label>
                                <textarea className="form-control" rows="4" value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} required placeholder="Describe your issue in detail..." />
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
