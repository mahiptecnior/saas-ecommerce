import React, { useState, useEffect } from 'react';
import api from '../api/axios';

const Channels = () => {
    const [channels, setChannels] = useState([]);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showConnectModal, setShowConnectModal] = useState(false);
    const [channelForm, setChannelForm] = useState({ channel_name: 'amazon', client_id: '', client_secret: '' });

    useEffect(() => {
        fetchChannels();
        fetchLogs();
    }, []);

    const fetchChannels = async () => {
        try {
            const res = await api.get('/channels');
            setChannels(res.data.data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const fetchLogs = async () => {
        try {
            const res = await api.get('/channels/logs');
            setLogs(res.data.data);
        } catch (err) { console.error(err); }
    };

    const handleConnect = async (e) => {
        e.preventDefault();
        try {
            await api.post('/channels/connect', {
                channel_name: channelForm.channel_name,
                credentials_json: { client_id: channelForm.client_id, client_secret: channelForm.client_secret }
            });
            alert('Channel connected!');
            setShowConnectModal(false);
            fetchChannels();
        } catch (err) { alert('Error connecting channel'); }
    };

    const handleSync = async (id) => {
        try {
            const res = await api.post(`/channels/${id}/sync`);
            alert(res.data.message);
            fetchChannels();
            fetchLogs();
        } catch (err) { alert('Sync failed'); }
    };

    if (loading) return <div className="fade-in">Loading Multi-Channel...</div>;

    return (
        <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                <div>
                    <h1>Multi-Channel Sync</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Connect and synchronize your inventory across global marketplaces.</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowConnectModal(true)}>+ Connect New Channel</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                {/* Active Channels */}
                <div className="card">
                    <h3>Connected Marketplaces</h3>
                    <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {channels.map(c => (
                            <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', border: '1px solid var(--border)', borderRadius: '12px', backgroundColor: 'var(--surface)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{ fontSize: '1.5rem' }}>
                                        {c.channel_name === 'amazon' ? '📦' : c.channel_name === 'shopify' ? '🛍️' : '💻'}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: '700', textTransform: 'uppercase' }}>{c.channel_name}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                            Last Sync: {c.last_sync_at ? new Date(c.last_sync_at).toLocaleString() : 'Never'}
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <span className="badge badge-success" style={{ alignSelf: 'center' }}>{c.status}</span>
                                    <button className="btn btn-sm btn-outline" onClick={() => handleSync(c.id)}>Sync Now</button>
                                </div>
                            </div>
                        ))}
                        {channels.length === 0 && <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No external channels connected.</div>}
                    </div>
                </div>

                {/* Sync Logs */}
                <div className="card">
                    <h3>Activity Logs</h3>
                    <div style={{ marginTop: '1.5rem', maxHeight: '400px', overflowY: 'auto' }}>
                        <table className="table" style={{ fontSize: '0.85rem' }}>
                            <thead>
                                <tr><th>Channel</th><th>Event</th><th>Status</th><th>Time</th></tr>
                            </thead>
                            <tbody>
                                {logs.map(log => (
                                    <tr key={log.id}>
                                        <td>{log.channel_name}</td>
                                        <td>{log.event_type}</td>
                                        <td><span className={`badge ${log.status === 'success' ? 'badge-success' : 'badge-danger'}`}>{log.status}</span></td>
                                        <td>{new Date(log.created_at).toLocaleTimeString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Connect Modal */}
            {showConnectModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                    <div className="card" style={{ width: '450px' }}>
                        <h3>Connect Marketplace</h3>
                        <form onSubmit={handleConnect} style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                            <div className="form-group">
                                <label>Channel Type</label>
                                <select className="form-control" value={channelForm.channel_name} onChange={e => setChannelForm({ ...channelForm, channel_name: e.target.value })}>
                                    <option value="amazon">Amazon Seller Central</option>
                                    <option value="flipkart">Flipkart Seller Hub</option>
                                    <option value="shopify">Shopify Store</option>
                                    <option value="facebook">Facebook Shop</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>API Client ID / Key</label>
                                <input type="text" className="form-control" value={channelForm.client_id} onChange={e => setChannelForm({ ...channelForm, client_id: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label>API Secret / Token</label>
                                <input type="password" className="form-control" value={channelForm.client_secret} onChange={e => setChannelForm({ ...channelForm, client_secret: e.target.value })} required />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                                <button type="button" className="btn" onClick={() => setShowConnectModal(false)} style={{ flex: 1 }}>Cancel</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Establish Connection</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Channels;
