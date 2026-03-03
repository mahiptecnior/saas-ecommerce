import React, { useState, useEffect } from 'react';
import api from '../api/axios';

const ThemeBuilder = () => {
    const [layout, setLayout] = useState({
        header: { title: 'My Store', logo: '' },
        sections: [
            { type: 'hero', content: 'Welcome to our premium store', background: '#f8fafc' },
            { type: 'products', title: 'Featured Products', count: 4 }
        ],
        footer: { text: '© 2026 SaaS eCommerce' }
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await api.get('/settings');
            if (res.data.data.builder_layout_json) {
                setLayout(res.data.data.builder_layout_json);
            }
        } catch (error) {
            console.error('Error fetching layout', error);
        } finally {
            setLoading(false);
        }
    };

    const saveLayout = async () => {
        try {
            await api.post('/settings', { builder_layout_json: layout });
            alert('Layout saved successfully!');
        } catch (error) {
            console.error('Error saving layout', error);
        }
    };

    const addSection = () => {
        setLayout({
            ...layout,
            sections: [...layout.sections, { type: 'text', content: 'New Section Content' }]
        });
    };

    return (
        <div className="fade-in" style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem' }}>
            <div className="builder-canvas" style={{ minHeight: '80vh', border: '2px dashed var(--border)', borderRadius: '12px', padding: '2rem', backgroundColor: '#fff' }}>
                <div style={{ padding: '1rem', borderBottom: '1px solid #eee', textAlign: 'center' }}>
                    <h1>{layout.header.title}</h1>
                </div>

                {layout.sections.map((section, idx) => (
                    <div key={idx} style={{
                        margin: '1rem 0',
                        padding: '2rem',
                        backgroundColor: section.background || '#f1f5f9',
                        borderRadius: '8px',
                        textAlign: 'center',
                        position: 'relative'
                    }}>
                        {section.type === 'hero' && <h2>{section.content}</h2>}
                        {section.type === 'products' && <div>[ {section.title} Component ]</div>}
                        {section.type === 'text' && <p>{section.content}</p>}
                        <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', fontSize: '10px', color: 'var(--text-muted)' }}>
                            {section.type.toUpperCase()}
                        </div>
                    </div>
                ))}

                <div style={{ padding: '1rem', borderTop: '1px solid #eee', textAlign: 'center', marginTop: '2rem' }}>
                    <p>{layout.footer.text}</p>
                </div>
            </div>

            <div className="builder-sidebar card">
                <h3>Editor</h3>
                <div style={{ marginTop: '1.5rem' }}>
                    <div className="form-group">
                        <label>Store Title</label>
                        <input
                            className="form-control"
                            type="text"
                            value={layout.header.title}
                            onChange={(e) => setLayout({ ...layout, header: { ...layout.header, title: e.target.value } })}
                        />
                    </div>
                    <button className="btn btn-primary" onClick={addSection} style={{ width: '100%', marginBottom: '1rem' }}>
                        Add Section
                    </button>
                    <button className="btn" onClick={saveLayout} style={{ width: '100%', backgroundColor: 'var(--success)', color: '#fff' }}>
                        Save Layout (JSON)
                    </button>
                </div>
                <div style={{ marginTop: '2rem' }}>
                    <h4>Current JSON</h4>
                    <pre style={{ fontSize: '10px', backgroundColor: '#f1f5f9', padding: '0.5rem', borderRadius: '4px', overflowX: 'auto' }}>
                        {JSON.stringify(layout, null, 2)}
                    </pre>
                </div>
            </div>
        </div>
    );
};

export default ThemeBuilder;
