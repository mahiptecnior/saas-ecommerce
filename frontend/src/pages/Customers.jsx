import React, { useState, useEffect } from 'react';
import api from '../api/axios';

const Customers = () => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ name: '', email: '', phone: '', address: '' });
    const [search, setSearch] = useState('');
    const [msg, setMsg] = useState('');

    useEffect(() => { fetchCustomers(); }, []);

    const fetchCustomers = async () => {
        setLoading(true);
        try {
            const res = await api.get('/customers');
            setCustomers(res.data.data || []);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const openCreate = () => { setEditing(null); setForm({ name: '', email: '', phone: '', address: '' }); setShowModal(true); };
    const openEdit = (c) => { setEditing(c); setForm({ name: c.name, email: c.email, phone: c.phone || '', address: c.address || '' }); setShowModal(true); };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editing) {
                await api.put(`/customers/${editing.id}`, form);
                setMsg('Customer updated!');
            } else {
                await api.post('/customers', form);
                setMsg('Customer added!');
            }
            setShowModal(false);
            fetchCustomers();
            setTimeout(() => setMsg(''), 3000);
        } catch (err) {
            alert(err.response?.data?.message || 'Error saving customer');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this customer?')) return;
        try {
            await api.delete(`/customers/${id}`);
            setMsg('Customer deleted.');
            fetchCustomers();
            setTimeout(() => setMsg(''), 3000);
        } catch (err) { alert('Error deleting customer'); }
    };

    const filtered = customers.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.email.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="fade-in">
            {msg && <div style={{ padding: '0.75rem', backgroundColor: 'var(--success)', color: '#fff', borderRadius: '8px', marginBottom: '1rem' }}>{msg}</div>}

            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
                    <div>
                        <h2>👥 Customers</h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{customers.length} total customers</p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', flex: 1, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                        <input
                            className="form-control"
                            placeholder="Search by name or email..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            style={{ maxWidth: '260px' }}
                        />
                        <button className="btn btn-primary" onClick={openCreate}>+ Add Customer</button>
                    </div>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
                            <th style={{ padding: '0.75rem' }}>Name</th>
                            <th style={{ padding: '0.75rem' }}>Email</th>
                            <th style={{ padding: '0.75rem' }}>Phone</th>
                            <th style={{ padding: '0.75rem' }}>Address</th>
                            <th style={{ padding: '0.75rem' }}>Joined</th>
                            <th style={{ padding: '0.75rem' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</td></tr>
                        ) : filtered.length === 0 ? (
                            <tr><td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No customers found.</td></tr>
                        ) : filtered.map(c => (
                            <tr key={c.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                <td style={{ padding: '0.75rem', fontWeight: '600' }}>{c.name}</td>
                                <td style={{ padding: '0.75rem', color: 'var(--primary)' }}>{c.email}</td>
                                <td style={{ padding: '0.75rem' }}>{c.phone || '—'}</td>
                                <td style={{ padding: '0.75rem', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.address || '—'}</td>
                                <td style={{ padding: '0.75rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{new Date(c.created_at).toLocaleDateString()}</td>
                                <td style={{ padding: '0.75rem' }}>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button className="btn" onClick={() => openEdit(c)} style={{ padding: '0.25rem 0.6rem', fontSize: '0.8rem', backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>Edit</button>
                                        <button className="btn" onClick={() => handleDelete(c.id)} style={{ padding: '0.25rem 0.6rem', fontSize: '0.8rem', backgroundColor: 'var(--danger)', color: '#fff' }}>Del</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="card" style={{ width: '480px', maxWidth: '95vw' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                            <h3>{editing ? 'Edit Customer' : 'Add Customer'}</h3>
                            <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem' }}>&times;</button>
                        </div>
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.3rem' }}>Name *</label>
                                    <input className="form-control" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="John Doe" />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.3rem' }}>Phone</label>
                                    <input className="form-control" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+91 98765 43210" />
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.3rem' }}>Email *</label>
                                <input className="form-control" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required placeholder="john@example.com" />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.3rem' }}>Address</label>
                                <textarea className="form-control" rows="2" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="123 Main Street, City, State" />
                            </div>
                            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                                <button type="button" className="btn" onClick={() => setShowModal(false)} style={{ backgroundColor: 'var(--border)' }}>Cancel</button>
                                <button type="submit" className="btn btn-primary">{editing ? 'Save Changes' : 'Add Customer'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Customers;
