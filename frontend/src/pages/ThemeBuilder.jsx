import React, { useState, useEffect } from 'react';
import api from '../api/axios';

const PRESET_THEMES = [
    { name: '🌊 Ocean Blue', primary: '#3b82f6', secondary: '#0ea5e9', accent: '#06b6d4' },
    { name: '🌿 Forest Green', primary: '#10b981', secondary: '#059669', accent: '#6ee7b7' },
    { name: '🔥 Sunset Orange', primary: '#f97316', secondary: '#ef4444', accent: '#fbbf24' },
    { name: '💜 Deep Purple', primary: '#8b5cf6', secondary: '#7c3aed', accent: '#c4b5fd' },
    { name: '🌸 Rose Pink', primary: '#ec4899', secondary: '#db2777', accent: '#f9a8d4' },
    { name: '🖤 Slate Dark', primary: '#475569', secondary: '#334155', accent: '#94a3b8' },
];

const ThemeBuilder = () => {
    const [primaryColor, setPrimaryColor] = useState('#6366f1');
    const [bgColor, setBgColor] = useState('#ffffff');
    const [textColor, setTextColor] = useState('#1e293b');
    const [sidebarColor, setSidebarColor] = useState('#f8fafc');
    const [borderRadius, setBorderRadius] = useState('12');
    const [fontFamily, setFontFamily] = useState('Inter');
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState('');
    const [previewMode, setPreviewMode] = useState('light');

    const fonts = ['Inter', 'Outfit', 'Roboto', 'Poppins', 'Nunito', 'DM Sans'];

    useEffect(() => {
        // Load saved theme from settings
        const loadTheme = async () => {
            try {
                const res = await api.get('/settings');
                const settings = res.data.data || {};
                if (settings.theme_primary_color) setPrimaryColor(settings.theme_primary_color);
                if (settings.theme_bg_color) setBgColor(settings.theme_bg_color);
                if (settings.theme_text_color) setTextColor(settings.theme_text_color);
                if (settings.theme_border_radius) setBorderRadius(settings.theme_border_radius);
                if (settings.theme_font) setFontFamily(settings.theme_font);
            } catch (e) { /* Use defaults */ }
        };
        loadTheme();
    }, []);

    const applyPreset = (preset) => {
        setPrimaryColor(preset.primary);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.put('/settings', {
                theme_primary_color: primaryColor,
                theme_bg_color: bgColor,
                theme_text_color: textColor,
                theme_border_radius: borderRadius,
                theme_font: fontFamily,
            });
            setMsg('✅ Theme saved successfully!');
            setTimeout(() => setMsg(''), 3000);
        } catch (err) {
            setMsg('❌ Error saving theme');
        } finally {
            setSaving(false);
        }
    };

    // Live preview styles
    const previewStyle = {
        backgroundColor: previewMode === 'light' ? bgColor : '#1e293b',
        color: previewMode === 'light' ? textColor : '#f1f5f9',
        fontFamily: `${fontFamily}, sans-serif`,
        borderRadius: `${borderRadius}px`,
        padding: '1.5rem',
        border: '1px solid #e2e8f0',
    };

    return (
        <div className="fade-in">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: '2rem' }}>
                {/* Controls Panel */}
                <div>
                    {/* Presets */}
                    <div className="card" style={{ marginBottom: '1.5rem' }}>
                        <h3 style={{ marginBottom: '1rem' }}>🎨 Quick Presets</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                            {PRESET_THEMES.map(preset => (
                                <button
                                    key={preset.name}
                                    onClick={() => applyPreset(preset)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                                        padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border)',
                                        cursor: 'pointer', fontSize: '0.8rem', fontWeight: '500',
                                        backgroundColor: 'var(--surface)', color: 'var(--text)',
                                        transition: 'all 0.15s'
                                    }}
                                >
                                    <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: preset.primary, display: 'inline-block', flexShrink: 0 }} />
                                    {preset.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Custom Colors */}
                    <div className="card" style={{ marginBottom: '1.5rem' }}>
                        <h3 style={{ marginBottom: '1rem' }}>🖌️ Custom Colors</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {[
                                { label: 'Primary / Brand Color', value: primaryColor, setter: setPrimaryColor },
                                { label: 'Background Color', value: bgColor, setter: setBgColor },
                                { label: 'Text Color', value: textColor, setter: setTextColor },
                                { label: 'Sidebar Color', value: sidebarColor, setter: setSidebarColor },
                            ].map(({ label, value, setter }) => (
                                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', justifyContent: 'space-between' }}>
                                    <label style={{ fontSize: '0.85rem', fontWeight: '500' }}>{label}</label>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <input type="color" value={value} onChange={e => setter(e.target.value)} style={{ width: '40px', height: '32px', border: 'none', cursor: 'pointer', borderRadius: '4px' }} />
                                        <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{value}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Typography & Shape */}
                    <div className="card">
                        <h3 style={{ marginBottom: '1rem' }}>📐 Typography & Shape</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', marginBottom: '0.4rem' }}>Font Family</label>
                                <select className="form-control" value={fontFamily} onChange={e => setFontFamily(e.target.value)}>
                                    {fonts.map(f => <option key={f} value={f}>{f}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', marginBottom: '0.4rem' }}>
                                    Border Radius: <strong>{borderRadius}px</strong>
                                </label>
                                <input type="range" min="0" max="24" value={borderRadius} onChange={e => setBorderRadius(e.target.value)} style={{ width: '100%' }} />
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                    <span>Sharp (0)</span><span>Rounded (24)</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Preview Panel */}
                <div>
                    <div className="card" style={{ position: 'sticky', top: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h3>👁️ Live Preview</h3>
                            <div style={{ display: 'flex', gap: '0.4rem' }}>
                                {['light', 'dark'].map(m => (
                                    <button key={m} onClick={() => setPreviewMode(m)} style={{ padding: '0.3rem 0.7rem', fontSize: '0.8rem', borderRadius: '6px', border: '1px solid var(--border)', cursor: 'pointer', backgroundColor: previewMode === m ? primaryColor : 'var(--surface)', color: previewMode === m ? '#fff' : 'var(--text)' }}>
                                        {m === 'light' ? '☀️ Light' : '🌙 Dark'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div style={previewStyle}>
                            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                                <div style={{ width: '80px', backgroundColor: sidebarColor, borderRadius: `${borderRadius}px`, padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                    {['Dashboard', 'Products', 'Orders', 'Settings'].map(item => (
                                        <div key={item} style={{ fontSize: '0.6rem', padding: '0.25rem 0.4rem', borderRadius: '4px', backgroundColor: item === 'Dashboard' ? primaryColor : 'transparent', color: item === 'Dashboard' ? '#fff' : previewMode === 'light' ? textColor : '#94a3b8' }}>{item}</div>
                                    ))}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', marginBottom: '0.75rem' }}>
                                        {['Revenue', 'Orders', 'Products', 'Customers'].map(k => (
                                            <div key={k} style={{ backgroundColor: previewMode === 'light' ? '#f8fafc' : '#1e293b', borderRadius: `${borderRadius}px`, padding: '0.5rem', fontSize: '0.65rem', border: `1px solid ${previewMode === 'light' ? '#e2e8f0' : '#334155'}` }}>
                                                <div style={{ color: '#94a3b8', marginBottom: '0.2rem' }}>{k}</div>
                                                <div style={{ fontWeight: '700', color: primaryColor }}>1,234</div>
                                            </div>
                                        ))}
                                    </div>
                                    <button style={{ width: '100%', padding: '0.4rem', backgroundColor: primaryColor, color: '#fff', border: 'none', borderRadius: `${borderRadius}px`, fontSize: '0.7rem', fontFamily: `${fontFamily}, sans-serif`, cursor: 'pointer', fontWeight: '600' }}>
                                        Primary Button
                                    </button>
                                </div>
                            </div>
                        </div>

                        {msg && <div style={{ padding: '0.6rem', backgroundColor: msg.includes('✅') ? '#d1fae5' : '#fee2e2', borderRadius: '6px', fontSize: '0.85rem', marginTop: '1rem', textAlign: 'center' }}>{msg}</div>}

                        <button
                            className="btn btn-primary"
                            onClick={handleSave}
                            disabled={saving}
                            style={{ width: '100%', marginTop: '1rem', padding: '0.75rem' }}
                        >
                            {saving ? 'Saving...' : '💾 Save Theme Settings'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ThemeBuilder;
