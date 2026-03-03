import React, { useState, useEffect } from 'react';
import api from '../api/axios';

const SystemManagement = () => {
    const [tenants, setTenants] = useState([]);
    const [modules, setModules] = useState([]);
    const [plans, setPlans] = useState([]);
    const [selectedTenant, setSelectedTenant] = useState(null);
    const [tenantModules, setTenantModules] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const results = await Promise.allSettled([
                api.get('/admin/tenants'),
                api.get('/admin/modules'),
                api.get('/admin/plans')
            ]);

            if (results[0].status === 'fulfilled') setTenants(results[0].value.data.data);
            if (results[1].status === 'fulfilled') setModules(results[1].value.data.data);
            if (results[2].status === 'fulfilled') setPlans(results[2].value.data.data);

            if (results.some(r => r.status === 'rejected')) {
                console.error("Some system API calls failed", results.filter(r => r.status === 'rejected').map(r => r.reason));
            }
        } catch (error) {
            console.error('Error fetching data', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectTenant = async (tenant) => {
        setSelectedTenant(tenant);
        try {
            const res = await api.get(`/admin/tenants/${tenant.id}/modules`);
            setTenantModules(res.data.data.map(m => m.id));
        } catch (error) {
            console.error('Error fetching tenant modules', error);
        }
    };

    const toggleModule = async (moduleId) => {
        if (!selectedTenant) return;

        const isAssigned = tenantModules.includes(moduleId);
        try {
            if (isAssigned) {
                await api.post('/admin/tenants/modules/remove', { tenantId: selectedTenant.id, moduleId });
                setTenantModules(tenantModules.filter(id => id !== moduleId));
            } else {
                await api.post('/admin/tenants/modules', { tenantId: selectedTenant.id, moduleId });
                setTenantModules([...tenantModules, moduleId]);
            }
        } catch (error) {
            console.error('Error toggling module', error);
        }
    };

    const updateStatus = async (tenantId, status) => {
        try {
            await api.patch(`/admin/tenants/${tenantId}/status`, { status });
            setTenants(tenants.map(t => t.id === tenantId ? { ...t, status } : t));
        } catch (error) {
            console.error('Error updating status', error);
        }
    };

    const handleAssignPlan = async (tenantId, planId) => {
        try {
            await api.post('/admin/tenants/plan', { tenantId, planId });
            alert('Plan assigned successfully!');
            fetchData();
        } catch (error) {
            console.error('Error assigning plan', error);
            alert('Error assigning plan');
        }
    };

    return (
        <div className="fade-in" style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '2rem' }}>
            <div className="card">
                <h2>Tenants Control</h2>
                {tenants.map(tenant => (
                    <div
                        key={tenant.id}
                        onClick={() => handleSelectTenant(tenant)}
                        style={{
                            padding: '1rem',
                            borderBottom: '1px solid var(--border)',
                            cursor: 'pointer',
                            backgroundColor: selectedTenant?.id === tenant.id ? 'var(--background)' : 'transparent',
                            borderRadius: '8px',
                            marginBottom: '0.5rem'
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <strong>{tenant.name}</strong>
                            <span className={`status-badge status-${tenant.status}`}>{tenant.status}</span>
                        </div>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{tenant.subdomain}.saas.com</p>
                        <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <button onClick={(e) => { e.stopPropagation(); updateStatus(tenant.id, 'active'); }} style={{ padding: '2px 8px', fontSize: '0.75rem' }} className="btn">Activate</button>
                            <button onClick={(e) => { e.stopPropagation(); updateStatus(tenant.id, 'suspended'); }} style={{ padding: '2px 8px', fontSize: '0.75rem' }} className="btn">Suspend</button>
                            <select
                                onChange={(e) => { e.stopPropagation(); handleAssignPlan(tenant.id, e.target.value); }}
                                style={{ fontSize: '0.75rem', padding: '2px' }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <option value="">Assign Plan</option>
                                {plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                    </div>
                ))}
            </div>

            <div className="card">
                <h2>Module Access {selectedTenant && `- ${selectedTenant.name}`}</h2>
                {!selectedTenant ? (
                    <div style={{ textAlign: 'center', padding: '3rem' }}>
                        <p style={{ color: 'var(--text-muted)' }}>Select a tenant to manage their modules</p>
                    </div>
                ) : (
                    <div>
                        <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: 'var(--background)', borderRadius: '8px' }}>
                            <p><strong>Subscription Management</strong></p>
                            <p style={{ fontSize: '0.875rem' }}>Current Plan: Professional (Example)</p>
                            <button className="btn btn-primary" style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>Upgrade / Downgrade Plan</button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            {modules.map(module => (
                                <div key={module.id} style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: '8px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <strong>{module.name.charAt(0).toUpperCase() + module.name.slice(1)}</strong>
                                        <input
                                            type="checkbox"
                                            checked={tenantModules.includes(module.id)}
                                            onChange={() => toggleModule(module.id)}
                                        />
                                    </div>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{module.description || 'Enable various business features for the tenant.'}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SystemManagement;
