import React, { useState, useEffect } from 'react';
import api from '../api/axios';

const Marketing = () => {
    const [activeTab, setActiveTab] = useState('campaigns');
    const [coupons, setCoupons] = useState([]);
    const [campaigns, setCampaigns] = useState([]);
    const [affiliates, setAffiliates] = useState([]);
    const [abandonedCarts, setAbandonedCarts] = useState([]);
    const [loading, setLoading] = useState(true);

    const [showCouponModal, setShowCouponModal] = useState(false);
    const [showCampaignModal, setShowCampaignModal] = useState(false);
    const [showAffiliateModal, setShowAffiliateModal] = useState(false);

    const [couponForm, setCouponForm] = useState({ code: '', discount_type: 'percentage', discount_value: '', expiry_date: '' });
    const [campaignForm, setCampaignForm] = useState({ name: '', type: 'email', message: '' });
    const [affiliateForm, setAffiliateForm] = useState({ customer_id: '', referral_code: '', commission_rate: '' });

    const [msg, setMsg] = useState('');

    useEffect(() => { fetchData(); }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'campaigns') {
                const res = await api.get('/modules/marketing/campaigns');
                setCampaigns(res.data.data);
            } else if (activeTab === 'coupons') {
                const res = await api.get('/modules/marketing/coupons');
                setCoupons(res.data.data);
            } else if (activeTab === 'affiliates') {
                const res = await api.get('/marketing-v2/affiliates');
                setAffiliates(res.data.data);
            } else if (activeTab === 'abandoned') {
                const res = await api.get('/marketing-v2/abandoned-carts');
                setAbandonedCarts(res.data.data);
            }
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const handleCreateCoupon = async (e) => {
        e.preventDefault();
        try {
            await api.post('/modules/marketing/coupons', couponForm);
            setMsg('Coupon created!');
            setShowCouponModal(false);
            setCouponForm({ code: '', discount_type: 'percentage', discount_value: '', expiry_date: '' });
            fetchData();
        } catch (err) { alert('Error saving coupon'); }
    };

    const handleLaunchCampaign = async (e) => {
        e.preventDefault();
        try {
            await api.post('/modules/marketing/campaigns', campaignForm);
            setMsg('Campaign launched! 🚀');
            setShowCampaignModal(false);
            setCampaignForm({ name: '', type: 'email', message: '' });
            fetchData();
        } catch (err) { alert('Error launching campaign'); }
    };

    const handleCreateAffiliate = async (e) => {
        e.preventDefault();
        try {
            await api.post('/marketing-v2/affiliates', affiliateForm);
            setMsg('Affiliate profile created!');
            setShowAffiliateModal(false);
            setAffiliateForm({ customer_id: '', referral_code: '', commission_rate: '' });
            fetchData();
        } catch (err) { alert('Error creating affiliate'); }
    };

    return (
        <div className="fade-in">
            {msg && <div style={{ padding: '0.75rem', backgroundColor: 'var(--success)', color: '#fff', borderRadius: '8px', marginBottom: '1rem' }}>{msg} <button onClick={() => setMsg('')} style={{ float: 'right', background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>×</button></div>}

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)' }}>
                {['campaigns', 'coupons', 'affiliates', 'abandoned'].map(tab => (
                    <button
                        key={tab}
                        className={`btn ${activeTab === tab ? 'btn-primary' : ''}`}
                        style={{ backgroundColor: activeTab === tab ? 'var(--primary)' : 'transparent', color: activeTab === tab ? 'white' : 'var(--text)', border: 'none', borderRadius: '4px 4px 0 0', padding: '0.75rem 1.5rem', textTransform: 'capitalize' }}
                        onClick={() => setActiveTab(tab)}
                    >
                        {tab.replace('abandoned', 'Abandoned Carts')}
                    </button>
                ))}
            </div>

            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ textTransform: 'capitalize' }}>{activeTab.replace('abandoned', 'Abandoned Carts')}</h2>
                    {activeTab === 'campaigns' && <button className="btn btn-primary" onClick={() => setShowCampaignModal(true)}>+ New Campaign</button>}
                    {activeTab === 'coupons' && <button className="btn btn-primary" onClick={() => setShowCouponModal(true)}>+ Create Coupon</button>}
                    {activeTab === 'affiliates' && <button className="btn btn-primary" onClick={() => setShowAffiliateModal(true)}>+ Register Affiliate</button>}
                </div>

                {activeTab === 'campaigns' && (
                    <table className="table">
                        <thead>
                            <tr><th>Name</th><th>Channel</th><th>Status</th><th>Launched</th></tr>
                        </thead>
                        <tbody>
                            {campaigns.map(c => (
                                <tr key={c.id}>
                                    <td>{c.name}</td>
                                    <td><span className="badge badge-active">{c.type}</span></td>
                                    <td><span className="badge badge-pending">{c.status}</span></td>
                                    <td>{new Date(c.created_at).toLocaleDateString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {activeTab === 'coupons' && (
                    <table className="table">
                        <thead>
                            <tr><th>Code</th><th>Type</th><th>Value</th><th>Expiry</th></tr>
                        </thead>
                        <tbody>
                            {coupons.map(c => (
                                <tr key={c.id}>
                                    <td style={{ fontWeight: 'bold' }}>{c.code}</td>
                                    <td>{c.discount_type}</td>
                                    <td>{c.discount_type === 'percentage' ? `${c.discount_value}%` : `$${c.discount_value}`}</td>
                                    <td>{c.expiry_date ? new Date(c.expiry_date).toLocaleDateString() : 'Never'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {activeTab === 'affiliates' && (
                    <table className="table">
                        <thead>
                            <tr><th>Customer</th><th>Referral Code</th><th>Comm. Rate</th><th>Status</th></tr>
                        </thead>
                        <tbody>
                            {affiliates.map(a => (
                                <tr key={a.id}>
                                    <td>{a.customer_name || `ID: ${a.customer_id}`}</td>
                                    <td style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{a.referral_code}</td>
                                    <td>{a.commission_rate}%</td>
                                    <td><span className="badge badge-success">{a.status}</span></td>
                                </tr>
                            ))}
                            {affiliates.length === 0 && <tr><td colSpan="4" style={{ textAlign: 'center', padding: '2rem' }}>No affiliates registered.</td></tr>}
                        </tbody>
                    </table>
                )}

                {activeTab === 'abandoned' && (
                    <table className="table">
                        <thead>
                            <tr><th>Customer</th><th>Order Value</th><th>Abandoned Since</th><th>Action</th></tr>
                        </thead>
                        <tbody>
                            {abandonedCarts.map(cart => (
                                <tr key={cart.id}>
                                    <td>{cart.customer_name} ({cart.customer_email})</td>
                                    <td style={{ fontWeight: 'bold' }}>${cart.total_amount}</td>
                                    <td>{new Date(cart.created_at).toLocaleString()}</td>
                                    <td><button className="btn btn-sm" style={{ backgroundColor: 'var(--primary)', color: 'white' }}>Send Recovery Email</button></td>
                                </tr>
                            ))}
                            {abandonedCarts.length === 0 && <tr><td colSpan="4" style={{ textAlign: 'center', padding: '2rem' }}>No abandoned carts found (older than 24h).</td></tr>}
                        </tbody>
                    </table>
                )}
            </div>

            {/* MODALS (Reusable logic from previous version) */}
            {showCouponModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="card" style={{ width: '400px' }}>
                        <h3>Create Coupon</h3>
                        <form onSubmit={handleCreateCoupon} style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <input className="form-control" placeholder="CODE" value={couponForm.code} onChange={e => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })} required />
                            <select className="form-control" value={couponForm.discount_type} onChange={e => setCouponForm({ ...couponForm, discount_type: e.target.value })}>
                                <option value="percentage">Percentage (%)</option>
                                <option value="fixed">Fixed Amount ($)</option>
                            </select>
                            <input className="form-control" type="number" placeholder="Value" value={couponForm.discount_value} onChange={e => setCouponForm({ ...couponForm, discount_value: e.target.value })} required />
                            <input className="form-control" type="date" value={couponForm.expiry_date} onChange={e => setCouponForm({ ...couponForm, expiry_date: e.target.value })} />
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button type="button" className="btn" onClick={() => setShowCouponModal(false)} style={{ flex: 1 }}>Cancel</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showAffiliateModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="card" style={{ width: '400px' }}>
                        <h3>Register Affiliate</h3>
                        <form onSubmit={handleCreateAffiliate} style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <input className="form-control" placeholder="Customer ID" value={affiliateForm.customer_id} onChange={e => setAffiliateForm({ ...affiliateForm, customer_id: e.target.value })} required />
                            <input className="form-control" placeholder="Referral Code (e.g. PARTNER20)" value={affiliateForm.referral_code} onChange={e => setAffiliateForm({ ...affiliateForm, referral_code: e.target.value })} required />
                            <input className="form-control" type="number" placeholder="Commission Rate (%)" value={affiliateForm.commission_rate} onChange={e => setAffiliateForm({ ...affiliateForm, commission_rate: e.target.value })} required />
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button type="button" className="btn" onClick={() => setShowAffiliateModal(false)} style={{ flex: 1 }}>Cancel</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Register</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showCampaignModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="card" style={{ width: '450px' }}>
                        <h3>Launch Campaign</h3>
                        <form onSubmit={handleLaunchCampaign} style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <input className="form-control" placeholder="Campaign Name" value={campaignForm.name} onChange={e => setCampaignForm({ ...campaignForm, name: e.target.value })} required />
                            <select className="form-control" value={campaignForm.type} onChange={e => setCampaignForm({ ...campaignForm, type: e.target.value })}>
                                <option value="email">Email</option>
                                <option value="sms">SMS</option>
                            </select>
                            <textarea className="form-control" placeholder="Message" value={campaignForm.message} onChange={e => setCampaignForm({ ...campaignForm, message: e.target.value })} required rows="3" />
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button type="button" className="btn" onClick={() => setShowCampaignModal(false)} style={{ flex: 1 }}>Cancel</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Launch 🚀</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Marketing;
