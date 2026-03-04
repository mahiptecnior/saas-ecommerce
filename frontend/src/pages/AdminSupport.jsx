import React, { useState, useEffect } from 'react';
import api from '../api/axios';

const priorityColor = (p) => {
    const colors = { high: { bg: '#fee2e2', text: '#991b1b' }, medium: { bg: '#fef3c7', text: '#92400e' }, low: { bg: '#d1fae5', text: '#065f46' } };
    return colors[p] || colors.medium;
};

const AdminSupport = () => {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [replies, setReplies] = useState([]);
    const [replyText, setReplyText] = useState('');
    const [filter, setFilter] = useState('all');

    useEffect(() => { fetchTickets(); }, []);

    const fetchTickets = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/support/tickets');
            setTickets(res.data.data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const openTicket = async (ticket) => {
        setSelectedTicket(ticket);
        setReplyText('');
        try {
            const res = await api.get(`/admin/support/tickets/${ticket.id}/replies`);
            setReplies(res.data.data || []);
        } catch (err) { setReplies([]); }
    };

    const handleReply = async (e) => {
        e.preventDefault();
        if (!replyText.trim()) return;
        try {
            await api.post(`/admin/support/tickets/${selectedTicket.id}/replies`, { message: replyText, is_admin: true });
            setReplyText('');
            const res = await api.get(`/admin/support/tickets/${selectedTicket.id}/replies`);
            setReplies(res.data.data || []);
            setSelectedTicket({ ...selectedTicket, status: 'answered' });
            fetchTickets();
        } catch (err) { alert('Error sending reply'); }
    };

    const updateStatus = async (id, status) => {
        try {
            await api.patch(`/admin/support/tickets/${id}/status`, { status });
            if (selectedTicket?.id === id) setSelectedTicket({ ...selectedTicket, status });
            fetchTickets();
        } catch (err) { alert('Error updating status'); }
    };

    const filtered = tickets.filter(t => filter === 'all' || t.status === filter);

    if (selectedTicket) {
        return (
            <div className="fade-in">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                    <button className="btn" onClick={() => { setSelectedTicket(null); setReplies([]); }} style={{ padding: '0.5rem 1rem' }}>← Back</button>
                    <h2>Ticket #{selectedTicket.id}: {selectedTicket.subject}</h2>
                    <span style={{ padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '700', backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
                        🏪 {selectedTicket.store_name}
                    </span>
                    <select className="form-control" value={selectedTicket.status} onChange={e => updateStatus(selectedTicket.id, e.target.value)} style={{ marginLeft: 'auto', width: 'auto', fontSize: '0.85rem' }}>
                        <option value="open">Open</option>
                        <option value="answered">Answered</option>
                        <option value="closed">Closed</option>
                    </select>
                </div>

                {/* Priority & Info bar */}
                <div className="card" style={{ marginBottom: '1rem', display: 'flex', gap: '1.5rem', padding: '0.75rem 1rem', backgroundColor: 'var(--background)' }}>
                    <span>Priority: <strong style={{ color: priorityColor(selectedTicket.priority).text }}>{(selectedTicket.priority || 'medium').toUpperCase()}</strong></span>
                    <span>Opened: <strong>{new Date(selectedTicket.created_at).toLocaleString()}</strong></span>
                </div>

                {/* Original */}
                <div className="card" style={{ marginBottom: '1rem', borderLeft: '4px solid var(--text-muted)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <strong>👤 Tenant Message</strong>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(selectedTicket.created_at).toLocaleString()}</span>
                    </div>
                    <p style={{ whiteSpace: 'pre-wrap' }}>{selectedTicket.message}</p>
                </div>

                {/* Replies */}
                {replies.map((reply, i) => (
                    <div key={i} className="card" style={{ marginBottom: '1rem', borderLeft: `4px solid ${reply.is_admin ? 'var(--primary)' : 'var(--text-muted)'}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <strong style={{ color: reply.is_admin ? 'var(--primary)' : 'inherit' }}>{reply.is_admin ? '🛡️ Admin (You)' : '👤 Tenant'}</strong>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(reply.created_at).toLocaleString()}</span>
                        </div>
                        <p style={{ whiteSpace: 'pre-wrap' }}>{reply.message}</p>
                    </div>
                ))}

                {selectedTicket.status !== 'closed' && (
                    <div className="card">
                        <h4 style={{ marginBottom: '1rem' }}>Reply as Admin</h4>
                        <form onSubmit={handleReply} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <textarea className="form-control" rows="4" value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Write your reply to the tenant..." required />
                            <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-end' }}>📤 Send Reply</button>
                        </form>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h2>🎧 Support Center</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Manage support tickets across all tenants</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {['all', 'open', 'answered', 'closed'].map(f => (
                        <button key={f} className={`btn${filter === f ? ' btn-primary' : ''}`} onClick={() => setFilter(f)} style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem', textTransform: 'capitalize' }}>
                            {f} {f === 'all' ? `(${tickets.length})` : `(${tickets.filter(t => t.status === f).length})`}
                        </button>
                    ))}
                </div>
            </div>

            <div className="card">
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
                            <th style={{ padding: '0.75rem' }}>ID</th>
                            <th style={{ padding: '0.75rem' }}>Store</th>
                            <th style={{ padding: '0.75rem' }}>Subject</th>
                            <th style={{ padding: '0.75rem' }}>Priority</th>
                            <th style={{ padding: '0.75rem' }}>Status</th>
                            <th style={{ padding: '0.75rem' }}>Date</th>
                            <th style={{ padding: '0.75rem' }}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="7" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</td></tr>
                        ) : filtered.length === 0 ? (
                            <tr><td colSpan="7" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No tickets found.</td></tr>
                        ) : filtered.map(ticket => (
                            <tr key={ticket.id} style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer' }} onClick={() => openTicket(ticket)}>
                                <td style={{ padding: '0.75rem', fontFamily: 'monospace' }}>#{ticket.id}</td>
                                <td style={{ padding: '0.75rem' }}><span style={{ fontWeight: '500' }}>🏪 {ticket.store_name}</span></td>
                                <td style={{ padding: '0.75rem', fontWeight: '500' }}>{ticket.subject}</td>
                                <td style={{ padding: '0.75rem' }}>
                                    <span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600', backgroundColor: priorityColor(ticket.priority).bg, color: priorityColor(ticket.priority).text }}>
                                        {(ticket.priority || 'medium').toUpperCase()}
                                    </span>
                                </td>
                                <td style={{ padding: '0.75rem' }}>
                                    <span className={`badge badge-${ticket.status === 'open' ? 'active' : ticket.status === 'answered' ? 'pending' : 'suspended'}`}>
                                        {ticket.status || 'open'}
                                    </span>
                                </td>
                                <td style={{ padding: '0.75rem', fontSize: '0.85rem' }}>{new Date(ticket.created_at).toLocaleDateString()}</td>
                                <td style={{ padding: '0.75rem' }}>
                                    <button className="btn btn-sm" style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem', backgroundColor: 'var(--primary)', color: '#fff' }}>Reply</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminSupport;
