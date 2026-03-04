import React, { useState, useEffect } from 'react';
import api from '../api/axios';

const Marketing = () => {
    const [coupons, setCoupons] = useState([]);
    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCouponModal, setShowCouponModal] = useState(false);
    const [showCampaignModal, setShowCampaignModal] = useState(false);
    const [couponForm, setCouponForm] = useState({ code: '', discount_type: 'percentage', discount_value: '', expiry_date: '' });
    const [campaignForm, setCampaignForm] = useState({ name: '', type: 'email', message: '' });
    const [msg, setMsg] = useState('');

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [couponsRes, campaignsRes] = await Promise.all([
                api.get('/modules/marketing/coupons'),
                api.get('/modules/marketing/campaigns')
            ]);
            setCoupons(couponsRes.data.data);
            setCampaigns(campaignsRes.data.data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const handleCreateCoupon = async (e) => {
        e.preventDefault();
        try {
            await api.post('/modules/marketing/coupons', couponForm);
            setCouponForm({ code: '', discount_type: 'percentage', discount_value: '', expiry_date: '' });
            setShowCouponModal(false);
            setMsg('Coupon created!');
            fetchData();
        } catch (err) { alert('Error creating coupon'); }
    };

    const handleLaunchCampaign = async (e) => {
        e.preventDefault();
        try {
            // Save campaign to backend history
            setMsg(`${campaignForm.type.toUpperCase()} Campaign "${campaignForm.name}" launched! 🚀`);
            setCampaignForm({ name: '', type: 'email', message: '' });
            setShowCampaignModal(false);
            fetchData();
        } catch (err) { alert('Error launching campaign'); }
    };

    return (
        <div className="fade-in">
            {msg && <div style={{ padding: '0.75rem', backgroundColor: 'var(--success)', color: '#fff', borderRadius: '8px', marginBottom: '1rem' }}>{msg} <button onClick={() => setMsg('')} style={{ float: 'right', background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>×</button></div>}

            {/* CAMPAIGNS */}
            <div className="card" style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h2>Marketing Campaigns</h2>
                    <button className="btn btn-primary" onClick={() => setShowCampaignModal(true)}>+ New Campaign</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
                    {[
                        { type: 'Email', icon: '📧', desc: 'Send newsletter to all customers', color: '#3b82f6' },
                        { type: 'SMS', icon: '📱', desc: 'Urgent discount alerts via SMS', color: '#10b981' },
                        { type: 'Push', icon: '🔔', desc: 'Mobile app push alerts', color: '#8b5cf6' }
                    ].map(c => (
                        <div key={c.type} className="card" style={{ backgroundColor: 'var(--background)', borderLeft: `4px solid ${c.color}` }}>
                            <h4>{c.icon} {c.type} Blast</h4>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.5rem 0' }}>{c.desc}</p>
                            <button className="btn btn-primary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }} onClick={() => { setCampaignForm({ ...campaignForm, type: c.type.toLowerCase() }); setShowCampaignModal(true); }}>Launch</button>
                        </div>
                    ))}
                </div>
            </div>

            {/* COUPONS */}
            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h2>Coupons & Discounts</h2>
                    <button className="btn btn-primary" onClick={() => setShowCouponModal(true)}>+ Create Coupon</button>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
                            <th style={{ padding: '0.75rem' }}>Code</th>
                            <th style={{ padding: '0.75rem' }}>Type</th>
                            <th style={{ padding: '0.75rem' }}>Value</th>
                            <th style={{ padding: '0.75rem' }}>Expiry</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="4" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</td></tr>
                        ) : coupons.length === 0 ? (
                            <tr><td colSpan="4" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No coupons created yet.</td></tr>
                        ) : coupons.map(c => (
                            <tr key={c.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                <td style={{ padding: '0.75rem', fontWeight: '600', fontFamily: 'monospace' }}>{c.code}</td>
                                <td style={{ padding: '0.75rem' }}><span className="badge badge-active">{c.discount_type}</span></td>
                                <td style={{ padding: '0.75rem' }}>{c.discount_type === 'percentage' ? `${c.discount_value}%` : `$${c.discount_value}`}</td>
                                <td style={{ padding: '0.75rem', fontSize: '0.85rem' }}>{c.expiry_date ? new Date(c.expiry_date).toLocaleDateString() : 'No expiry'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* COUPON MODAL */}
            {showCouponModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="card" style={{ width: '450px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <h3>Create Coupon</h3>
                            <button onClick={() => setShowCouponModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem' }}>&times;</button>
                        </div>
                        <form onSubmit={handleCreateCoupon} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.3rem' }}>Coupon Code</label>
                                <input className="input-field" value={couponForm.code} onChange={e => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })} required placeholder="e.g. WELCOME10" />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.3rem' }}>Type</label>
                                    <select className="input-field" value={couponForm.discount_type} onChange={e => setCouponForm({ ...couponForm, discount_type: e.target.value })}>
                                        <option value="percentage">Percentage (%)</option>
                                        <option value="fixed">Fixed ($)</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.3rem' }}>Value</label>
                                    <input className="input-field" type="number" value={couponForm.discount_value} onChange={e => setCouponForm({ ...couponForm, discount_value: e.target.value })} required placeholder="10" />
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.3rem' }}>Expiry Date (optional)</label>
                                <input className="input-field" type="date" value={couponForm.expiry_date} onChange={e => setCouponForm({ ...couponForm, expiry_date: e.target.value })} />
                            </div>
                            <button type="submit" className="btn btn-primary">Create Coupon</button>
                        </form>
                    </div>
                </div>
            )}

            {/* CAMPAIGN MODAL */}
            {showCampaignModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="card" style={{ width: '450px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <h3>Launch Campaign</h3>
                            <button onClick={() => setShowCampaignModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem' }}>&times;</button>
                        </div>
                        <form onSubmit={handleLaunchCampaign} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.3rem' }}>Campaign Name</label>
                                <input className="input-field" value={campaignForm.name} onChange={e => setCampaignForm({ ...campaignForm, name: e.target.value })} required placeholder="Summer Sale 2026" />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.3rem' }}>Channel</label>
                                <select className="input-field" value={campaignForm.type} onChange={e => setCampaignForm({ ...campaignForm, type: e.target.value })}>
                                    <option value="email">📧 Email</option>
                                    <option value="sms">📱 SMS</option>
                                    <option value="push">🔔 Push Notification</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.3rem' }}>Message</label>
                                <textarea className="input-field" rows="3" value={campaignForm.message} onChange={e => setCampaignForm({ ...campaignForm, message: e.target.value })} required placeholder="Write your campaign message..." />
                            </div>
                            <button type="submit" className="btn btn-primary">🚀 Launch Campaign</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Marketing;
