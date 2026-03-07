import React, { useState, useEffect } from 'react';
import api from '../api/axios';

const CRM = () => {
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ name: '', email: '', phone: '', stage: 'new', value: '', source: '', notes: '' });

    const stages = ['new', 'contacted', 'proposal', 'won', 'lost'];

    useEffect(() => {
        fetchLeads();
    }, []);

    const fetchLeads = async () => {
        setLoading(true);
        try {
            const res = await api.get('/crm/leads');
            setLeads(res.data.data);
        } catch (err) {
            console.error('Error fetching leads', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateLead = async (e) => {
        e.preventDefault();
        try {
            await api.post('/crm/leads', form);
            alert('Lead created!');
            setShowModal(false);
            setForm({ name: '', email: '', phone: '', stage: 'new', value: '', source: '', notes: '' });
            fetchLeads();
        } catch (err) {
            alert('Error creating lead');
        }
    };

    const updateStage = async (id, stage) => {
        try {
            await api.put(`/crm/leads/${id}/stage`, { stage });
            fetchLeads();
        } catch (err) {
            alert('Error updating stage');
        }
    };

    if (loading) return <div className="fade-in">Loading CRM...</div>;

    return (
        <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1>Lead Pipeline</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Track and manage your sales opportunities across the funnel.</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Add New Lead</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${stages.length}, 1fr)`, gap: '1.5rem', minHeight: '60vh' }}>
                {stages.map(stage => (
                    <div key={stage} style={{ backgroundColor: 'var(--surface)', borderRadius: '12px', padding: '1rem', border: '1px solid var(--border)' }}>
                        <h4 style={{ textTransform: 'uppercase', fontSize: '0.85rem', marginBottom: '1.5rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                            {stage}
                            <span style={{ backgroundColor: 'var(--border)', padding: '0.1rem 0.5rem', borderRadius: '10px', fontSize: '0.7rem' }}>
                                {leads.filter(l => l.stage === stage).length}
                            </span>
                        </h4>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {leads.filter(l => l.stage === stage).map(lead => (
                                <div key={lead.id} className="card" style={{ padding: '1rem', cursor: 'grab', position: 'relative' }}>
                                    <div style={{ fontWeight: '600', marginBottom: '0.5rem' }}>{lead.name}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                                        {lead.source && <span style={{ marginRight: '0.5rem' }}>🏷️ {lead.source}</span>}
                                        {lead.value > 0 && <span style={{ fontWeight: 'bold', color: 'var(--success)' }}>${lead.value}</span>}
                                    </div>

                                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                                        <select
                                            value={lead.stage}
                                            onChange={(e) => updateStage(lead.id, e.target.value)}
                                            style={{ fontSize: '0.75rem', padding: '2px 5px', borderRadius: '4px', border: '1px solid var(--border)' }}
                                        >
                                            {stages.map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {showModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                    <div className="card" style={{ width: '500px' }}>
                        <h3>Capture New Lead</h3>
                        <form onSubmit={handleCreateLead} style={{ marginTop: '1.5rem' }}>
                            <div className="form-group">
                                <label>Contact Name *</label>
                                <input type="text" className="form-control" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label>Email</label>
                                    <input type="email" className="form-control" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Phone</label>
                                    <input type="text" className="form-control" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label>Estimated Value ($)</label>
                                    <input type="number" className="form-control" value={form.value} onChange={e => setForm({ ...form, value: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Lead Source</label>
                                    <input type="text" className="form-control" placeholder="e.g. Website, Referral" value={form.source} onChange={e => setForm({ ...form, source: e.target.value })} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Notes</label>
                                <textarea className="form-control" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}></textarea>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                                <button type="button" className="btn" onClick={() => setShowModal(false)} style={{ flex: 1 }}>Cancel</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Add Lead</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CRM;
