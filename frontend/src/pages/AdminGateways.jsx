import React, { useState, useEffect } from 'react';
import api from '../api/axios';

const AdminGateways = () => {
    const [settings, setSettings] = useState({
        stripe_enabled: 'false',
        stripe_public_key: '',
        stripe_secret_key: '',
        paypal_enabled: 'false',
        paypal_client_id: '',
        paypal_secret: ''
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const { data } = await api.get('/platform-settings');
            if (data.data) {
                setSettings(prev => ({
                    ...prev,
                    stripe_enabled: data.data.stripe_enabled || 'false',
                    stripe_public_key: data.data.stripe_public_key || '',
                    stripe_secret_key: data.data.stripe_secret_key || '',
                    paypal_enabled: data.data.paypal_enabled || 'false',
                    paypal_client_id: data.data.paypal_client_id || '',
                    paypal_secret: data.data.paypal_secret || ''
                }));
            }
        } catch (error) {
            console.error('Error fetching gateway settings', error);
        }
    };

    const handleChange = (e) => {
        const { name, type, checked, value } = e.target;
        setSettings(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (checked ? 'true' : 'false') : value
        }));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        try {
            await api.post('/platform-settings', settings);
            setMessage('Payment Gateways configured successfully!');
        } catch (error) {
            setMessage('Failed to save configurations.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate-fade-in">
            <div style={{ marginBottom: '2rem' }}>
                <h2>Payment Gateways</h2>
                <p className="text-muted">Configure the payment gateways available for tenant subscriptions and platform fees.</p>
            </div>

            {message && (
                <div style={{ padding: '1rem', backgroundColor: message.includes('Failed') ? 'var(--danger)' : 'var(--success)', color: 'white', borderRadius: '8px', marginBottom: '1.5rem', fontWeight: '500' }}>
                    {message}
                </div>
            )}

            <form onSubmit={handleSave} style={{ display: 'grid', gap: '2rem' }}>
                {/* Stripe Configuration */}
                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ width: '40px', height: '40px', backgroundColor: '#6366f1', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>S</div>
                            <h3 style={{ margin: 0 }}>Stripe Setup</h3>
                        </div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: '500' }}>
                            <input
                                type="checkbox"
                                name="stripe_enabled"
                                checked={settings.stripe_enabled === 'true'}
                                onChange={handleChange}
                                style={{ transform: 'scale(1.2)' }}
                            />
                            Enable Stripe
                        </label>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', opacity: settings.stripe_enabled === 'true' ? 1 : 0.6 }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.9rem' }}>Publishable Key</label>
                            <input
                                type="text"
                                className="input-field"
                                name="stripe_public_key"
                                value={settings.stripe_public_key}
                                onChange={handleChange}
                                placeholder="pk_test_..."
                                disabled={settings.stripe_enabled !== 'true'}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.9rem' }}>Secret Key</label>
                            <input
                                type="password"
                                className="input-field"
                                name="stripe_secret_key"
                                value={settings.stripe_secret_key}
                                onChange={handleChange}
                                placeholder="sk_test_..."
                                disabled={settings.stripe_enabled !== 'true'}
                            />
                        </div>
                    </div>
                </div>

                {/* PayPal Configuration */}
                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ width: '40px', height: '40px', backgroundColor: '#003087', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>P</div>
                            <h3 style={{ margin: 0 }}>PayPal Setup</h3>
                        </div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: '500' }}>
                            <input
                                type="checkbox"
                                name="paypal_enabled"
                                checked={settings.paypal_enabled === 'true'}
                                onChange={handleChange}
                                style={{ transform: 'scale(1.2)' }}
                            />
                            Enable PayPal
                        </label>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', opacity: settings.paypal_enabled === 'true' ? 1 : 0.6 }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.9rem' }}>Client ID</label>
                            <input
                                type="text"
                                className="input-field"
                                name="paypal_client_id"
                                value={settings.paypal_client_id}
                                onChange={handleChange}
                                placeholder="AZ...x9"
                                disabled={settings.paypal_enabled !== 'true'}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.9rem' }}>Secret</label>
                            <input
                                type="password"
                                className="input-field"
                                name="paypal_secret"
                                value={settings.paypal_secret}
                                onChange={handleChange}
                                placeholder="E...wB"
                                disabled={settings.paypal_enabled !== 'true'}
                            />
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button type="submit" className="btn btn-primary" disabled={loading} style={{ padding: '0.75rem 2rem', fontSize: '1rem' }}>
                        {loading ? 'Saving...' : 'Save Gateway Configurations'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AdminGateways;
