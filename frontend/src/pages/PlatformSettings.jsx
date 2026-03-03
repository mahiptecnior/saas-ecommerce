import React, { useState, useEffect } from 'react';
import api from '../api/axios';

const PlatformSettings = () => {
    const [settings, setSettings] = useState({
        smtp_host: '',
        smtp_port: '',
        smtp_user: '',
        smtp_pass: '',
        smtp_from: ''
    });
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState('');

    // Test SMTP State
    const [showTestModal, setShowTestModal] = useState(false);
    const [testEmail, setTestEmail] = useState('');
    const [testLoading, setTestLoading] = useState(false);
    const [testMsg, setTestMsg] = useState('');

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const { data } = await api.get('/platform-settings');
            if (data.data) {
                setSettings({
                    smtp_host: data.data.smtp_host || '',
                    smtp_port: data.data.smtp_port || '',
                    smtp_user: data.data.smtp_user || '',
                    smtp_pass: data.data.smtp_pass || '',
                    smtp_from: data.data.smtp_from || ''
                });
            }
        } catch (error) {
            console.error('Error fetching settings', error);
        }
    };

    const handleChange = (e) => {
        setSettings({ ...settings, [e.target.name]: e.target.value });
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMsg('');
        try {
            await api.post('/platform-settings', settings);
            setMsg('Settings saved successfully!');
            setTimeout(() => setMsg(''), 3000);
        } catch (error) {
            setMsg('Failed to save settings.');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleTestSmtp = async (e) => {
        e.preventDefault();
        setTestLoading(true);
        setTestMsg('');
        try {
            const { data } = await api.post('/platform-settings/test', { email: testEmail });
            setTestMsg(data.message || 'Test email sent!');
        } catch (error) {
            setTestMsg('Failed to send test email.');
        } finally {
            setTestLoading(false);
        }
    };

    return (
        <div className="animate-fade-in card" style={{ maxWidth: '600px' }}>
            <h2>Platform Settings (SMTP)</h2>
            <p className="text-muted" style={{ marginBottom: '1.5rem' }}>Configure global SMTP credentials for platform emails.</p>

            {msg && <div style={{ padding: '1rem', backgroundColor: msg.includes('Failed') ? 'var(--danger)' : 'var(--success)', color: 'white', borderRadius: '8px', marginBottom: '1rem' }}>{msg}</div>}

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>SMTP Host</label>
                    <input
                        type="text"
                        name="smtp_host"
                        className="input-field"
                        value={settings.smtp_host}
                        onChange={handleChange}
                        placeholder="e.g., smtp.tecnior.com"
                        required
                    />
                </div>
                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>SMTP Port</label>
                    <input
                        type="number"
                        name="smtp_port"
                        className="input-field"
                        value={settings.smtp_port}
                        onChange={handleChange}
                        placeholder="e.g., 587"
                        required
                    />
                </div>
                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>SMTP User (Email)</label>
                    <input
                        type="email"
                        name="smtp_user"
                        className="input-field"
                        value={settings.smtp_user}
                        onChange={handleChange}
                        placeholder="e.g., noreply@tecnior.com"
                        required
                    />
                </div>
                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>SMTP Password</label>
                    <input
                        type="password"
                        name="smtp_pass"
                        className="input-field"
                        value={settings.smtp_pass}
                        onChange={handleChange}
                        placeholder="••••••••"
                        required
                    />
                </div>
                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>From Name/Email</label>
                    <input
                        type="text"
                        name="smtp_from"
                        className="input-field"
                        value={settings.smtp_from}
                        onChange={handleChange}
                        placeholder='e.g., "Nazmart Platform" <noreply@tecnior.com>'
                        required
                    />
                </div>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? 'Saving...' : 'Save Settings'}
                    </button>
                    <button type="button" className="btn" onClick={() => setShowTestModal(true)}>
                        Test SMTP
                    </button>
                </div>
            </form>

            {/* Test SMTP Modal */}
            {showTestModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="card" style={{ width: '400px', backgroundColor: 'var(--surface)' }}>
                        <h3>Test SMTP Configuration</h3>
                        {testMsg && <div style={{ padding: '0.5rem', backgroundColor: testMsg.includes('Failed') ? 'var(--danger)' : 'var(--success)', color: 'white', borderRadius: '4px', marginBottom: '1rem', marginTop: '1rem', fontSize: '0.875rem' }}>{testMsg}</div>}
                        <form onSubmit={handleTestSmtp} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                            <input
                                type="email"
                                className="input-field"
                                placeholder="Enter test email address"
                                value={testEmail}
                                onChange={(e) => setTestEmail(e.target.value)}
                                required
                            />
                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                <button type="button" className="btn" onClick={() => setShowTestModal(false)}>Close</button>
                                <button type="submit" className="btn btn-primary" disabled={testLoading}>
                                    {testLoading ? 'Sending...' : 'Send Test Email'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PlatformSettings;
