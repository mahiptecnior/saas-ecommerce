import React, { useState, useEffect } from 'react';
import api from '../api/axios';

const Settings = () => {
    const [activeTab, setActiveTab] = useState('general');
    const [loading, setLoading] = useState(true);

    const [settings, setSettings] = useState({
        store_name: '', currency: 'USD', logo_url: '', seo_title: '', seo_description: '', custom_css: '',
        business_name: '', business_address: '', business_tax_id: '', gst_number: '',
        bank_details: { account_name: '', account_number: '', bank_name: '', routing_number: '' },
        invoice_template: 'standard',
        smtp_host: '', smtp_port: '', smtp_user: '', smtp_pass: '', smtp_from: ''
    });

    const [shippingRules, setShippingRules] = useState([]);
    const [showShippingModal, setShowShippingModal] = useState(false);
    const [editingRule, setEditingRule] = useState(null);
    const [ruleForm, setRuleForm] = useState({ name: '', rate: '', condition_type: 'flat', is_active: true });

    useEffect(() => {
        fetchData();
    }, []);



    const fetchData = async () => {
        setLoading(true);
        try {
            const [settingsRes, shippingRes] = await Promise.all([
                api.get('/settings'),
                api.get('/shipping')
            ]);

            if (settingsRes.data.data) {
                const s = settingsRes.data.data;
                // Parse builder_layout_json if it's a string to prevent double-stringify
                if (typeof s.builder_layout_json === 'string') {
                    try { s.builder_layout_json = JSON.parse(s.builder_layout_json); } catch (e) { s.builder_layout_json = {}; }
                }
                setSettings(prev => ({
                    ...prev,
                    ...s,
                    bank_details: s.bank_details ? (typeof s.bank_details === 'string' ? JSON.parse(s.bank_details) : s.bank_details) : prev.bank_details
                }));
            }
            if (shippingRes.data.data) {
                setShippingRules(shippingRes.data.data);
            }
        } catch (error) {
            console.error('Error fetching settings/shipping', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveSettings = async (e) => {
        if (e) e.preventDefault();
        try {
            // Sanitize settings to avoid undefined values
            const payload = { ...settings };
            Object.keys(payload).forEach(key => {
                if (payload[key] === undefined) payload[key] = '';
            });

            await api.post('/settings', payload);
            window.toast?.success ? window.toast.success('Settings updated!') : alert('Settings updated successfully!');
        } catch (error) {
            console.error('Error saving settings', error);
            const msg = error.response?.data?.message || 'Error saving settings';
            alert(msg);
        }
    };

    const [testingSmtp, setTestingSmtp] = useState(false);
    const [showTestModal, setShowTestModal] = useState(false);
    const [testEmail, setTestEmail] = useState('');
    const [testResult, setTestResult] = useState(null);

    const handleTestSMTP = async (e) => {
        if (e) e.preventDefault();
        if (!testEmail) { alert('Please enter a recipient email address'); return; }
        setTestingSmtp(true);
        setTestResult(null);
        try {
            const res = await api.post('/settings/test-smtp', {
                smtp_host: settings.smtp_host,
                smtp_port: settings.smtp_port,
                smtp_user: settings.smtp_user,
                smtp_pass: settings.smtp_pass,
                smtp_from: settings.smtp_from,
                test_email: testEmail
            });
            setTestResult({ success: true, message: `Test email sent successfully to ${testEmail}!` });
        } catch (error) {
            setTestResult({ success: false, message: error.response?.data?.message || 'SMTP Test Failed' });
        } finally {
            setTestingSmtp(false);
        }
    };

    const handleSaveShippingRule = async (e) => {
        e.preventDefault();
        try {
            if (editingRule) {
                await api.put(`/shipping/${editingRule.id}`, ruleForm);
            } else {
                await api.post('/shipping', ruleForm);
            }
            setShowShippingModal(false);
            fetchData();
        } catch (error) {
            console.error('Error saving shipping rule', error);
            alert('Error saving shipping rule');
        }
    };

    const handleDeleteShippingRule = async (id) => {
        if (!window.confirm("Delete this shipping rule?")) return;
        try {
            await api.delete(`/shipping/${id}`);
            fetchData();
        } catch (error) {
            alert('Error deleting shipping rule');
        }
    };

    const handleBankChange = (field, value) => {
        setSettings(prev => ({
            ...prev,
            bank_details: { ...prev.bank_details, [field]: value }
        }));
    };

    if (loading) return <div className="fade-in">Loading configurations...</div>;

    const tabs = [
        { id: 'general', label: 'General' },
        { id: 'tax', label: 'Tax & Legal' },
        { id: 'bank', label: 'Bank Details' },
        { id: 'shipping', label: 'Shipping Rules' },
        { id: 'invoice', label: 'Invoice Design' },
        { id: 'smtp', label: 'Email Config' }
    ];

    return (
        <div className="fade-in">
            <h2 style={{ marginBottom: '1.5rem', color: 'var(--text-main)', fontSize: '1.5rem', fontWeight: '600' }}>Store Settings</h2>

            <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
                {/* Vertical Tabs Server Setup Nav */}
                <div style={{ width: '250px', background: 'var(--surface)', borderRadius: '12px', padding: '1rem', border: '1px solid var(--border)' }}>
                    {tabs.map(t => (
                        <button
                            key={t.id}
                            onClick={() => setActiveTab(t.id)}
                            style={{
                                display: 'block', width: '100%', textAlign: 'left', padding: '0.85rem 1.25rem',
                                marginBottom: '0.5rem', borderRadius: '8px', cursor: 'pointer',
                                background: activeTab === t.id ? '#eef2ff' : 'transparent',
                                color: activeTab === t.id ? 'var(--primary)' : 'var(--text-muted)',
                                fontWeight: activeTab === t.id ? '600' : '500',
                                border: 'none', transition: 'all 0.2s'
                            }}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="card" style={{
                    flex: 1,
                    padding: '2.5rem',
                    borderRadius: '20px',
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)',
                    backgroundColor: '#fff',
                    border: '1px solid #f1f5f9'
                }}>
                    {/* GENERAL TAB */}
                    {activeTab === 'general' && (
                        <form onSubmit={handleSaveSettings}>
                            <h3 style={{ marginBottom: '1.5rem' }}>Basic Settings</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                <div className="form-group">
                                    <label>Store Name</label>
                                    <input className="form-control" type="text" value={settings.store_name || ''} onChange={(e) => setSettings({ ...settings, store_name: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label>Currency</label>
                                    <select className="form-control" value={settings.currency || 'USD'} onChange={(e) => setSettings({ ...settings, currency: e.target.value })}>
                                        <option value="USD">USD ($)</option>
                                        <option value="EUR">EUR (€)</option>
                                        <option value="GBP">GBP (£)</option>
                                        <option value="INR">INR (₹)</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Logo URL</label>
                                <input className="form-control" type="text" value={settings.logo_url || ''} onChange={(e) => setSettings({ ...settings, logo_url: e.target.value })} placeholder="https://example.com/logo.png" />
                            </div>
                            <h3 style={{ marginTop: '2rem', marginBottom: '1rem' }}>SEO Configurations</h3>
                            <div className="form-group">
                                <label>SEO Title</label>
                                <input className="form-control" type="text" value={settings.seo_title || ''} onChange={(e) => setSettings({ ...settings, seo_title: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>SEO Description</label>
                                <textarea className="form-control" rows="3" value={settings.seo_description || ''} onChange={(e) => setSettings({ ...settings, seo_description: e.target.value })}></textarea>
                            </div>
                            <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }}>Save General Settings</button>
                        </form>
                    )}

                    {/* TAX & LEGAL TAB */}
                    {activeTab === 'tax' && (
                        <form onSubmit={handleSaveSettings}>
                            <h3 style={{ marginBottom: '1.5rem' }}>Tax & Legal Information</h3>
                            <div className="form-group">
                                <label>Registered Business Name</label>
                                <input className="form-control" type="text" value={settings.business_name || ''} onChange={(e) => setSettings({ ...settings, business_name: e.target.value })} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                <div className="form-group">
                                    <label>Business Tax ID (EIN/PAN)</label>
                                    <input className="form-control" type="text" value={settings.business_tax_id || ''} onChange={(e) => setSettings({ ...settings, business_tax_id: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>GST/VAT Number</label>
                                    <input className="form-control" type="text" value={settings.gst_number || ''} onChange={(e) => setSettings({ ...settings, gst_number: e.target.value })} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Business Address</label>
                                <textarea className="form-control" rows="3" value={settings.business_address || ''} onChange={(e) => setSettings({ ...settings, business_address: e.target.value })}></textarea>
                            </div>
                            <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }}>Save Legal Information</button>
                        </form>
                    )}

                    {/* BANK DETAILS TAB */}
                    {activeTab === 'bank' && (
                        <form onSubmit={handleSaveSettings}>
                            <h3 style={{ marginBottom: '1.5rem' }}>Bank Account Details</h3>
                            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>These details will be displayed on your invoices for B2B/Wholesale payments.</p>

                            <div className="form-group">
                                <label>Account Holder Name</label>
                                <input className="form-control" type="text" value={settings.bank_details?.account_name || ''} onChange={(e) => handleBankChange('account_name', e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label>Bank Name</label>
                                <input className="form-control" type="text" value={settings.bank_details?.bank_name || ''} onChange={(e) => handleBankChange('bank_name', e.target.value)} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                <div className="form-group">
                                    <label>Account Number</label>
                                    <input className="form-control" type="text" value={settings.bank_details?.account_number || ''} onChange={(e) => handleBankChange('account_number', e.target.value)} />
                                </div>
                                <div className="form-group">
                                    <label>IFSC / Routing / SWIFT Code</label>
                                    <input className="form-control" type="text" value={settings.bank_details?.routing_number || ''} onChange={(e) => handleBankChange('routing_number', e.target.value)} />
                                </div>
                            </div>
                            <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }}>Save Bank Details</button>
                        </form>
                    )}

                    {/* INVOICE SYSTEM */}
                    {activeTab === 'invoice' && (
                        <form onSubmit={handleSaveSettings}>
                            <h3 style={{ marginBottom: '1.5rem' }}>Invoice Configuration</h3>
                            <div className="form-group">
                                <label>Invoice Template Design</label>
                                <select className="form-control" value={settings.invoice_template || 'standard'} onChange={(e) => setSettings({ ...settings, invoice_template: e.target.value })}>
                                    <option value="standard">Standard Template (Classic)</option>
                                    <option value="minimal">Minimalist Template</option>
                                    <option value="elegant">Elegant / Premium Template</option>
                                </select>
                            </div>
                            <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }}>Save Invoice Design</button>
                        </form>
                    )}

                    {/* SMTP CONFIGURATION */}
                    {activeTab === 'smtp' && (
                        <div className="smtp-config">
                            <div style={{ padding: '0 0.5rem' }}>
                                <h3 style={{ marginBottom: '0.5rem', color: 'var(--text-main)', fontSize: '1.25rem' }}>Email / SMTP Configuration</h3>
                                <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.95rem', lineHeight: '1.5' }}>
                                    Connect your own SMTP server to handle all outgoing platform emails with your custom branding.
                                </p>
                            </div>

                            <form onSubmit={handleSaveSettings}>
                                <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)', marginBottom: '1.5rem' }}>
                                    <div className="form-group">
                                        <label style={{ fontWeight: '600', color: '#475569' }}>SMTP Host</label>
                                        <input className="form-control" type="text" value={settings.smtp_host || ''} onChange={(e) => setSettings({ ...settings, smtp_host: e.target.value })} placeholder="smtp.gmail.com or smtp.mailtrap.io"
                                            style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0.75rem' }} />
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                        <div className="form-group">
                                            <label style={{ fontWeight: '600', color: '#475569' }}>SMTP Port</label>
                                            <input className="form-control" type="number" value={settings.smtp_port || ''} onChange={(e) => setSettings({ ...settings, smtp_port: e.target.value })} placeholder="587"
                                                style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0.75rem' }} />
                                        </div>
                                        <div className="form-group">
                                            <label style={{ fontWeight: '600', color: '#475569' }}>From Email Address</label>
                                            <input className="form-control" type="email" value={settings.smtp_from || ''} onChange={(e) => setSettings({ ...settings, smtp_from: e.target.value })} placeholder="notifications@yourdomain.com"
                                                style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0.75rem' }} />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label style={{ fontWeight: '600', color: '#475569' }}>SMTP Username</label>
                                        <input className="form-control" type="text" value={settings.smtp_user || ''} onChange={(e) => setSettings({ ...settings, smtp_user: e.target.value })}
                                            style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0.75rem' }} />
                                    </div>
                                    <div className="form-group">
                                        <label style={{ fontWeight: '600', color: '#475569' }}>SMTP Password</label>
                                        <input className="form-control" type="password" value={settings.smtp_pass || ''} onChange={(e) => setSettings({ ...settings, smtp_pass: e.target.value })}
                                            style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0.75rem' }} />
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                                    <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 2rem', borderRadius: '10px', boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.2)' }}>
                                        Save Configuration
                                    </button>
                                    <button type="button" onClick={() => { setTestResult(null); setShowTestModal(true); }} className="btn"
                                        style={{ padding: '0.75rem 2rem', borderRadius: '10px', backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', fontWeight: '600' }}>
                                        Test Connection
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* SHIPPING RULES */}
                    {activeTab === 'shipping' && (
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h3>Shipping Rates & Conditions</h3>
                                <button className="btn btn-primary" onClick={() => { setEditingRule(null); setRuleForm({ name: '', rate: '', condition_type: 'flat', is_active: true }); setShowShippingModal(true); }}>+ Add Shipping Rule</button>
                            </div>

                            {shippingRules.length === 0 ? (
                                <p style={{ color: 'var(--text-muted)' }}>No shipping rules defined yet. Add flat rates or conditional rules based on price/weight.</p>
                            ) : (
                                <table className="table" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                                    <thead style={{ borderBottom: '2px solid var(--border)' }}>
                                        <tr>
                                            <th style={{ padding: '1rem 0' }}>Rule Name</th>
                                            <th style={{ padding: '1rem 0' }}>Type</th>
                                            <th style={{ padding: '1rem 0' }}>Rate</th>
                                            <th style={{ padding: '1rem 0', textAlign: 'right' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {shippingRules.map(rule => (
                                            <tr key={rule.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                                <td style={{ padding: '1rem 0', fontWeight: '500' }}>{rule.name}
                                                    {!rule.is_active && <span style={{ marginLeft: '0.5rem', color: 'red', fontSize: '0.8rem' }}>(Inactive)</span>}
                                                </td>
                                                <td style={{ padding: '1rem 0', textTransform: 'capitalize' }}>{rule.condition_type}</td>
                                                <td style={{ padding: '1rem 0' }}>{settings.currency} {parseFloat(rule.rate).toFixed(2)}</td>
                                                <td style={{ padding: '1rem 0', textAlign: 'right' }}>
                                                    <button className="btn btn-sm" style={{ marginRight: '0.5rem', backgroundColor: '#f3f4f6', color: '#374151' }} onClick={() => { setEditingRule(rule); setRuleForm(rule); setShowShippingModal(true); }}>Edit</button>
                                                    <button className="btn btn-sm" style={{ backgroundColor: '#fee2e2', color: '#991b1b' }} onClick={() => handleDeleteShippingRule(rule.id)}>Delete</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* SHIPPING RULE MODAL */}
            {showShippingModal && (
                <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="modal-content card" style={{ padding: '2rem', width: '500px', backgroundColor: '#fff', borderRadius: '12px' }}>
                        <h3 style={{ marginBottom: '1.5rem' }}>{editingRule ? 'Edit' : 'Create'} Shipping Rule</h3>
                        <form onSubmit={handleSaveShippingRule}>
                            <div className="form-group">
                                <label>Rule Name (e.g. Standard Delivery)</label>
                                <input className="form-control" type="text" value={ruleForm.name} onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label>Condition Type</label>
                                <select className="form-control" value={ruleForm.condition_type} onChange={(e) => setRuleForm({ ...ruleForm, condition_type: e.target.value })}>
                                    <option value="flat">Flat Rate (Applies to all normally)</option>
                                    <option value="free">Free Shipping (Conditional)</option>
                                    <option value="price">Based on Cart Value</option>
                                    <option value="weight">Based on Order Weight</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Shipping Rate Cost</label>
                                <input className="form-control" type="number" step="0.01" value={ruleForm.rate} onChange={(e) => setRuleForm({ ...ruleForm, rate: e.target.value })} required />
                            </div>
                            <div className="form-group" style={{ display: 'flex', alignItems: 'center' }}>
                                <input type="checkbox" checked={ruleForm.is_active} onChange={(e) => setRuleForm({ ...ruleForm, is_active: e.target.checked })} style={{ marginRight: '0.5rem' }} />
                                <label style={{ margin: 0 }}>Active</label>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                                <button type="button" className="btn" style={{ backgroundColor: '#e5e7eb', color: '#374151' }} onClick={() => setShowShippingModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Save Rule</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* TEST SMTP MODAL */}
            {showTestModal && (
                <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
                    <div className="modal-content card" style={{ padding: '2.5rem', width: '480px', backgroundColor: '#fff', borderRadius: '20px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
                        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                            <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', fontSize: '24px' }}>📧</div>
                            <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#1e293b' }}>Send Test Email</h3>
                            <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '0.5rem' }}>Enter the email address to receive a test email from your SMTP server</p>
                        </div>

                        <form onSubmit={handleTestSMTP}>
                            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                <label style={{ fontWeight: '600', color: '#475569', fontSize: '0.85rem', display: 'block', marginBottom: '0.5rem' }}>Recipient Email Address</label>
                                <input
                                    className="form-control"
                                    type="email"
                                    value={testEmail}
                                    onChange={(e) => setTestEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    required
                                    autoFocus
                                    style={{ border: '1px solid #cbd5e1', borderRadius: '10px', padding: '0.85rem 1rem', fontSize: '0.95rem', width: '100%', boxSizing: 'border-box' }}
                                />
                            </div>

                            <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '1rem 1.25rem', marginBottom: '1.5rem', border: '1px solid #e2e8f0' }}>
                                <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>
                                    <strong>From:</strong> {settings.smtp_from || 'Not configured'}<br />
                                    <strong>Server:</strong> {settings.smtp_host || 'Not configured'}:{settings.smtp_port || '—'}
                                </p>
                            </div>

                            {testResult && (
                                <div style={{
                                    padding: '1rem 1.25rem', borderRadius: '10px', marginBottom: '1.5rem',
                                    background: testResult.success ? '#f0fdf4' : '#fef2f2',
                                    border: `1px solid ${testResult.success ? '#bbf7d0' : '#fecaca'}`,
                                    color: testResult.success ? '#166534' : '#991b1b',
                                    fontSize: '0.9rem'
                                }}>
                                    {testResult.success ? '✅ ' : '❌ '}{testResult.message}
                                </div>
                            )}

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                                <button type="button" className="btn" onClick={() => setShowTestModal(false)}
                                    style={{ backgroundColor: '#f1f5f9', color: '#475569', padding: '0.75rem 1.5rem', borderRadius: '10px', border: '1px solid #e2e8f0', fontWeight: '600' }}>
                                    Close
                                </button>
                                <button type="submit" disabled={testingSmtp} className="btn btn-primary"
                                    style={{ padding: '0.75rem 1.5rem', borderRadius: '10px', boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.2)', opacity: testingSmtp ? 0.7 : 1 }}>
                                    {testingSmtp ? '⏳ Sending...' : '📤 Send Test Email'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Settings;
