import React, { useState, useEffect } from 'react';
import api from '../api/axios';

const Tenants = () => {
    const [tenants, setTenants] = useState([]);
    const [name, setName] = useState('');
    const [subdomain, setSubdomain] = useState('');

    useEffect(() => {
        fetchTenants();
    }, []);

    const fetchTenants = async () => {
        try {
            const { data } = await api.get('/admin/tenants');
            setTenants(data.data);
        } catch (err) {
            console.error('Error fetching tenants', err);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await api.post('/admin/tenants', { name, subdomain });
            setName('');
            setSubdomain('');
            fetchTenants();
        } catch (err) {
            alert('Error creating tenant');
        }
    };

    return (
        <div>
            <div className="card">
                <h3>Create New Tenant</h3>
                <form onSubmit={handleCreate} style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                    <input
                        className="input-field"
                        placeholder="Store Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                    <input
                        className="input-field"
                        placeholder="Subdomain"
                        value={subdomain}
                        onChange={(e) => setSubdomain(e.target.value)}
                        required
                    />
                    <button type="submit" className="btn btn-primary" style={{ height: '42px' }}>Create</button>
                </form>
            </div>

            <div className="card" style={{ marginTop: '2rem' }}>
                <h3>All Tenants</h3>
                <table style={{ width: '100%', marginTop: '1rem', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                            <th style={{ padding: '0.5rem' }}>Name</th>
                            <th style={{ padding: '0.5rem' }}>Subdomain</th>
                            <th style={{ padding: '0.5rem' }}>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tenants.map(t => (
                            <tr key={t.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                <td style={{ padding: '0.5rem' }}>{t.name}</td>
                                <td style={{ padding: '0.5rem' }}>{t.subdomain}</td>
                                <td style={{ padding: '0.5rem' }}><span className={`badge badge-${t.status}`}>{t.status}</span></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Tenants;
