import React, { useState, useEffect } from 'react';
import api from '../api/axios';

const Support = () => {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTickets();
    }, []);

    const fetchTickets = async () => {
        try {
            const res = await api.get('/modules/support/tickets');
            setTickets(res.data.data);
        } catch (error) {
            console.error('Error fetching tickets', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fade-in">
            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2>Support Tickets</h2>
                    <button className="btn btn-primary">Open New Ticket</button>
                </div>
                <table className="table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Subject</th>
                            <th>Priority</th>
                            <th>Status</th>
                            <th>Created At</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tickets.map((ticket) => (
                            <tr key={ticket.id}>
                                <td>#{ticket.id}</td>
                                <td>{ticket.subject}</td>
                                <td>
                                    <span style={{
                                        padding: '0.25rem 0.5rem',
                                        borderRadius: '4px',
                                        fontSize: '0.75rem',
                                        backgroundColor: ticket.priority === 'high' ? '#fee2e2' : '#f3f4f6',
                                        color: ticket.priority === 'high' ? '#991b1b' : '#374151'
                                    }}>
                                        {ticket.priority.toUpperCase()}
                                    </span>
                                </td>
                                <td>
                                    <span className={`status-badge status-${ticket.status}`}>
                                        {ticket.status.replace('_', ' ')}
                                    </span>
                                </td>
                                <td>{new Date(ticket.created_at).toLocaleDateString()}</td>
                            </tr>
                        ))}
                        {tickets.length === 0 && (
                            <tr>
                                <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>No support tickets found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Support;
