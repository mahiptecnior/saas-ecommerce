import React, { useState, useEffect } from 'react';
import api from '../api/axios';

const Plans = () => {
    const [plans, setPlans] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);

    // Form state
    const [id, setId] = useState(null);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [priceMonthly, setPriceMonthly] = useState('');
    const [priceYearly, setPriceYearly] = useState('');
    const [productLimit, setProductLimit] = useState('-1');
    const [orderLimit, setOrderLimit] = useState('-1');
    const [staffLimit, setStaffLimit] = useState('-1');

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        try {
            const { data } = await api.get('/admin/plans');
            setPlans(data.data);
        } catch (err) {
            console.error('Error fetching plans', err);
        }
    };

    const openCreateModal = () => {
        setEditMode(false);
        setId(null);
        setName('');
        setDescription('');
        setPriceMonthly('');
        setPriceYearly('');
        setProductLimit('-1');
        setOrderLimit('-1');
        setStaffLimit('-1');
        setIsModalOpen(true);
    };

    const openEditModal = (plan) => {
        setEditMode(true);
        setId(plan.id);
        setName(plan.name);
        setDescription(plan.description || '');
        setPriceMonthly(plan.price_monthly);
        setPriceYearly(plan.price_yearly);
        setProductLimit(plan.product_limit);
        setOrderLimit(plan.order_limit);
        setStaffLimit(plan.staff_limit);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const payload = {
            name, description, price_monthly: priceMonthly, price_yearly: priceYearly,
            product_limit: productLimit, order_limit: orderLimit, staff_limit: staffLimit
        };

        try {
            if (editMode) {
                await api.put(`/admin/plans/${id}`, payload);
            } else {
                await api.post('/admin/plans', payload);
            }
            closeModal();
            fetchPlans();
        } catch (err) {
            alert(editMode ? 'Error updating plan' : 'Error creating plan');
        }
    };

    const handleDelete = async (planId) => {
        if (window.confirm('Are you sure you want to delete this plan?')) {
            try {
                await api.delete(`/admin/plans/${planId}`);
                fetchPlans();
            } catch (err) {
                alert('Error deleting plan');
            }
        }
    };

    return (
        <div className="animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h2>Subscription Plans</h2>
                    <p className="text-muted">Configure the plans available to your tenants.</p>
                </div>
                <button onClick={openCreateModal} className="btn btn-primary">+ Create New Plan</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {plans.map(plan => (
                    <div key={plan.id} className="card" style={{ borderTop: '4px solid var(--primary)', position: 'relative' }}>
                        <div style={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex', gap: '0.5rem' }}>
                            <button onClick={() => openEditModal(plan)} className="btn btn-outline" style={{ padding: '4px 12px', fontSize: '12px' }}>Edit</button>
                            <button onClick={() => handleDelete(plan.id)} className="btn btn-danger" style={{ padding: '4px 12px', fontSize: '12px' }}>Delete</button>
                        </div>
                        <h4 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', width: '70%' }}>{plan.name}</h4>
                        <div style={{ marginBottom: '1rem' }}>
                            <span style={{ fontSize: '1.75rem', fontWeight: 'bold' }}>${plan.price_monthly}</span>
                            <span className="text-muted"> / mo</span>
                        </div>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <span style={{ fontWeight: '600' }}>${plan.price_yearly}</span>
                            <span className="text-muted"> / yr</span>
                        </div>
                        <ul style={{ listStyle: 'none', padding: 0, fontSize: '0.9rem' }}>
                            <li style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center' }}>
                                <span style={{ color: 'var(--success)', marginRight: '0.5rem' }}>✓</span> Core Modules
                            </li>
                            <li style={{ marginBottom: '0.5rem' }}>📦 <strong>{plan.product_limit === -1 ? 'Unlimited' : plan.product_limit}</strong> Products</li>
                            <li style={{ marginBottom: '0.5rem' }}>🛒 <strong>{plan.order_limit === -1 ? 'Unlimited' : plan.order_limit}</strong> Orders</li>
                            <li style={{ marginBottom: '0.5rem' }}>👥 <strong>{plan.staff_limit === -1 ? 'Unlimited' : plan.staff_limit}</strong> Staff</li>
                            {plan.description && <li style={{ marginTop: '1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>{plan.description}</li>}
                        </ul>
                    </div>
                ))}
            </div>

            {isModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
                    <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3>{editMode ? 'Edit Plan' : 'Create New Plan'}</h3>
                            <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem', color: 'var(--text-muted)' }}>&times;</button>
                        </div>
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: '500' }}>Plan Name</label>
                                    <input className="input-field" value={name} onChange={(e) => setName(e.target.value)} required />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: '500' }}>Description</label>
                                    <input className="input-field" value={description} onChange={(e) => setDescription(e.target.value)} />
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: '500' }}>Monthly Price ($)</label>
                                    <input className="input-field" type="number" step="0.01" value={priceMonthly} onChange={(e) => setPriceMonthly(e.target.value)} required />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: '500' }}>Yearly Price ($)</label>
                                    <input className="input-field" type="number" step="0.01" value={priceYearly} onChange={(e) => setPriceYearly(e.target.value)} required />
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: '500' }}>Product Limit</label>
                                    <input className="input-field" type="number" value={productLimit} onChange={(e) => setProductLimit(e.target.value)} title="-1 for unlimited" />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: '500' }}>Order Limit</label>
                                    <input className="input-field" type="number" value={orderLimit} onChange={(e) => setOrderLimit(e.target.value)} title="-1 for unlimited" />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: '500' }}>Staff Limit</label>
                                    <input className="input-field" type="number" value={staffLimit} onChange={(e) => setStaffLimit(e.target.value)} title="-1 for unlimited" />
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                                <button type="button" className="btn btn-outline" onClick={closeModal}>Cancel</button>
                                <button type="submit" className="btn btn-primary">{editMode ? 'Save Changes' : 'Create Plan'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Plans;
