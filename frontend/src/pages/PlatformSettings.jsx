import React, { useState, useEffect } from 'react';
import api from '../api/axios';

const PlatformSettings = () => {
    const [activeTab, setActiveTab] = useState('general');
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState('');

    // Settings State (General & SMTP)
    const [settings, setSettings] = useState({
        smtp_host: '',
        smtp_port: '',
        smtp_user: '',
        smtp_pass: '',
        smtp_from: '',
        default_currency: 'USD',
        platform_logo: ''
    });

    // Profile State
    const [profile, setProfile] = useState({
        name: '',
        email: '',
        password: ''
    });

    // Logo Upload State
    const [logoFile, setLogoFile] = useState(null);
    const [logoPreview, setLogoPreview] = useState('');

    // Test SMTP State
    const [showTestModal, setShowTestModal] = useState(false);
    const [testEmail, setTestEmail] = useState('');
    const [testLoading, setTestLoading] = useState(false);
    const [testMsg, setTestMsg] = useState('');

    useEffect(() => {
        fetchSettings();
        const user = JSON.parse(localStorage.getItem('user'));
        if (user) {
            setProfile(prev => ({ ...prev, name: user.name, email: user.email }));
        }
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
                    smtp_from: data.data.smtp_from || '',
                    default_currency: data.data.default_currency || 'USD',
                    platform_logo: data.data.platform_logo || ''
                });
                if (data.data.platform_logo) {
                    setLogoPreview(`http://localhost:5001${data.data.platform_logo}`);
                }
            }
        } catch (error) {
            console.error('Error fetching settings', error);
        }
    };

    const handleSettingsChange = (e) => {
        setSettings({ ...settings, [e.target.name]: e.target.value });
    };

    const handleProfileChange = (e) => {
        setProfile({ ...profile, [e.target.name]: e.target.value });
    };

    const handleLogoSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            setLogoFile(file);
            setLogoPreview(URL.createObjectURL(file));
        }
    };

    const handleSettingsSave = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMsg('');

        try {
            // If a new logo was selected, upload it first
            let finalSettings = { ...settings };

            if (logoFile) {
                const formData = new FormData();
                formData.append('logo', logoFile);
                const uploadRes = await api.post('/platform-settings/logo', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                if (uploadRes.data.success && uploadRes.data.url) {
                    finalSettings.platform_logo = uploadRes.data.url;
                }
            }

            await api.post('/platform-settings', finalSettings);

            // Re-fetch to normalize state
            await fetchSettings();
            setLogoFile(null);

            setMsg('Settings saved successfully!');
            setTimeout(() => setMsg(''), 3000);
        } catch (error) {
            setMsg('Failed to save settings.');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleProfileSave = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMsg('');

        try {
            await api.put('/auth/profile', profile);

            // Update local storage partly
            const user = JSON.parse(localStorage.getItem('user'));
            if (user) {
                user.name = profile.name;
                user.email = profile.email;
                localStorage.setItem('user', JSON.stringify(user));
            }

            // reset password field
            setProfile(prev => ({ ...prev, password: '' }));

            setMsg('Profile updated successfully!');
            setTimeout(() => setMsg(''), 3000);
        } catch (error) {
            setMsg('Failed to update profile.');
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

    // Tab button styles
    const tabStyle = (tabId) => ({
        padding: '0.75rem 1.5rem',
        cursor: 'pointer',
        borderBottom: activeTab === tabId ? '2px solid var(--primary)' : '2px solid transparent',
        color: activeTab === tabId ? 'var(--primary)' : 'var(--text)',
        fontWeight: activeTab === tabId ? '600' : '400',
        background: 'none',
        borderTop: 'none',
        borderLeft: 'none',
        borderRight: 'none',
        fontSize: '1rem'
    });

    return (
        <div className="animate-fade-in card" style={{ maxWidth: '700px' }}>
            <h2>Platform Settings</h2>
            <p className="text-muted" style={{ marginBottom: '1.5rem' }}>Manage global configurations, mailing, and your admin profile.</p>

            {/* Tabs Header */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '2rem' }}>
                <button style={tabStyle('general')} onClick={() => setActiveTab('general')}>General</button>
                <button style={tabStyle('smtp')} onClick={() => setActiveTab('smtp')}>SMTP Settings</button>
                <button style={tabStyle('profile')} onClick={() => setActiveTab('profile')}>Admin Profile</button>
            </div>

            {msg && <div style={{ padding: '1rem', backgroundColor: msg.includes('Failed') ? 'var(--danger)' : 'var(--success)', color: 'white', borderRadius: '8px', marginBottom: '1.5rem' }}>{msg}</div>}

            {/* GENERAL TAB */}
            {activeTab === 'general' && (
                <form onSubmit={handleSettingsSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Default System Currency</label>
                        <select
                            name="default_currency"
                            className="input-field"
                            value={settings.default_currency}
                            onChange={handleSettingsChange}
                            required
                        >
                            <option value="USD">USD ($) - US Dollar</option>
                            <option value="EUR">EUR (€) - Euro</option>
                            <option value="GBP">GBP (£) - British Pound</option>
                            <option value="INR">INR (₹) - Indian Rupee</option>
                            <option value="AUD">AUD ($) - Australian Dollar</option>
                            <option value="CAD">CAD ($) - Canadian Dollar</option>
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Platform Logo</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            {logoPreview ? (
                                <img src={logoPreview} alt="Logo Preview" style={{ width: '80px', height: '80px', objectFit: 'contain', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.5rem', backgroundColor: '#fff' }} />
                            ) : (
                                <div style={{ width: '80px', height: '80px', border: '1px dashed var(--border)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>No Logo</div>
                            )}
                            <div>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleLogoSelect}
                                    style={{ display: 'block', marginBottom: '0.5rem' }}
                                    id="logoUpload"
                                />
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Upload a transparent PNG or JPG (Max 5MB).</p>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Saving...' : 'Save General Settings'}
                        </button>
                    </div>
                </form>
            )}

            {/* SMTP TAB */}
            {activeTab === 'smtp' && (
                <form onSubmit={handleSettingsSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>SMTP Host</label>
                        <input
                            type="text"
                            name="smtp_host"
                            className="input-field"
                            value={settings.smtp_host}
                            onChange={handleSettingsChange}
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
                            onChange={handleSettingsChange}
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
                            onChange={handleSettingsChange}
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
                            onChange={handleSettingsChange}
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
                            onChange={handleSettingsChange}
                            placeholder='e.g., "Nazmart Platform" <noreply@tecnior.com>'
                            required
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Saving...' : 'Save SMTP Settings'}
                        </button>
                        <button type="button" className="btn btn-outline" onClick={() => setShowTestModal(true)}>
                            Send Test Email
                        </button>
                    </div>
                </form>
            )}

            {/* PROFILE TAB */}
            {activeTab === 'profile' && (
                <form onSubmit={handleProfileSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Admin Name</label>
                        <input
                            type="text"
                            name="name"
                            className="input-field"
                            value={profile.name}
                            onChange={handleProfileChange}
                            required
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Admin Email</label>
                        <input
                            type="email"
                            name="email"
                            className="input-field"
                            value={profile.email}
                            onChange={handleProfileChange}
                            required
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>New Password</label>
                        <input
                            type="password"
                            name="password"
                            className="input-field"
                            value={profile.password}
                            onChange={handleProfileChange}
                            placeholder="Leave blank to keep current password"
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Updating...' : 'Update Profile'}
                        </button>
                    </div>
                </form>
            )}

            {/* Test SMTP Modal */}
            {showTestModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="card animate-fade-in" style={{ width: '400px', backgroundColor: 'var(--surface)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0 }}>Test SMTP Config</h3>
                            <button onClick={() => setShowTestModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-muted)' }}>&times;</button>
                        </div>

                        {testMsg && <div style={{ padding: '0.5rem', backgroundColor: testMsg.includes('Failed') ? 'var(--danger)' : 'var(--success)', color: 'white', borderRadius: '4px', marginBottom: '1rem', marginTop: '1rem', fontSize: '0.875rem' }}>{testMsg}</div>}

                        <form onSubmit={handleTestSmtp} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
                            <input
                                type="email"
                                className="input-field"
                                placeholder="Enter test email address"
                                value={testEmail}
                                onChange={(e) => setTestEmail(e.target.value)}
                                required
                            />
                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                <button type="button" className="btn btn-outline" onClick={() => setShowTestModal(false)}>Cancel</button>
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
