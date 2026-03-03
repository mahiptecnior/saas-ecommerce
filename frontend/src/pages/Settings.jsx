import React, { useState, useEffect } from 'react';
import api from '../api/axios';

const Settings = () => {
    const [settings, setSettings] = useState({
        store_name: '',
        currency: 'USD',
        logo_url: '',
        seo_title: '',
        seo_description: '',
        custom_css: ''
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await api.get('/settings');
            if (res.data.data) {
                setSettings(res.data.data);
            }
        } catch (error) {
            console.error('Error fetching settings', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            await api.post('/settings', settings);
            alert('Settings updated successfully!');
        } catch (error) {
            console.error('Error saving settings', error);
            alert('Error saving settings');
        }
    };

    if (loading) return <div>Loading settings...</div>;

    return (
        <div className="fade-in">
            <div className="card" style={{ maxWidth: '800px', margin: '0 auto' }}>
                <h2>Store Settings</h2>
                <form onSubmit={handleSave} style={{ marginTop: '2rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div className="form-group">
                            <label>Store Name</label>
                            <input className="form-control" type="text" value={settings.store_name} onChange={(e) => setSettings({ ...settings, store_name: e.target.value })} required />
                        </div>
                        <div className="form-group">
                            <label>Currency</label>
                            <select className="form-control" value={settings.currency} onChange={(e) => setSettings({ ...settings, currency: e.target.value })}>
                                <option value="USD">USD ($)</option>
                                <option value="EUR">EUR (€)</option>
                                <option value="GBP">GBP (£)</option>
                                <option value="INR">INR (₹)</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Logo URL</label>
                        <input className="form-control" type="text" value={settings.logo_url} onChange={(e) => setSettings({ ...settings, logo_url: e.target.value })} placeholder="https://example.com/logo.png" />
                    </div>

                    <hr style={{ margin: '2rem 0', borderColor: 'var(--border)' }} />

                    <h3>SEO & Metadata</h3>
                    <div className="form-group">
                        <label>SEO Title</label>
                        <input className="form-control" type="text" value={settings.seo_title} onChange={(e) => setSettings({ ...settings, seo_title: e.target.value })} placeholder="The best store for..." />
                    </div>
                    <div className="form-group">
                        <label>SEO Description</label>
                        <textarea className="form-control" rows="3" value={settings.seo_description} onChange={(e) => setSettings({ ...settings, seo_description: e.target.value })} placeholder="Brief description for search engines..."></textarea>
                    </div>

                    <div className="form-group">
                        <label>Custom CSS (Optional)</label>
                        <textarea className="form-control" rows="5" value={settings.custom_css} onChange={(e) => setSettings({ ...settings, custom_css: e.target.value })} placeholder=".header { background: red; }"></textarea>
                    </div>

                    <div style={{ marginTop: '2rem' }}>
                        <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Save All Settings</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Settings;
