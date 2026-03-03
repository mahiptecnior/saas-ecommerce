import React, { useState, useEffect } from 'react';
import api from '../api/axios';

const Plans = () => {
    const [plans, setPlans] = useState([]);
    const [name, setName] = useState('');
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

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await api.post('/admin/plans', {
                name,
                price_monthly: priceMonthly,
                price_yearly: priceYearly,
                product_limit: productLimit,
                order_limit: orderLimit,
                staff_limit: staffLimit
            });
            setName('');
            setPriceMonthly('');
            setPriceYearly('');
            setProductLimit('-1');
            setOrderLimit('-1');
            setStaffLimit('-1');
            fetchPlans();
        } catch (err) {
            alert('Error creating plan');
        }
    };

    return (
        <div className="animate-fade-in">
            <div className="card">
                <h3>Subscription Plans</h3>
                <p className="text-muted" style={{ marginBottom: '1.5rem' }}>Configure the plans available to your tenants.</p>

                <form onSubmit={handleCreate} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '1rem', marginBottom: '2rem' }}>
                    <input
                        className="input-field"
                        placeholder="Plan Name (e.g. Enterprise)"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                    <input
                        className="input-field"
                        type="number"
                        placeholder="Monthly Price"
                        value={priceMonthly}
                        onChange={(e) => setPriceMonthly(e.target.value)}
                        required
                    />
                    <input
                        className="input-field"
                        type="number"
                        placeholder="Yearly Price"
                        value={priceYearly}
                        onChange={(e) => setPriceYearly(e.target.value)}
                        required
                    />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                        <input className="input-field" type="number" placeholder="Prod Limit" value={productLimit} onChange={(e) => setProductLimit(e.target.value)} title="Product Limit (-1 for unlimited)" />
                        <input className="input-field" type="number" placeholder="Order Limit" value={orderLimit} onChange={(e) => setOrderLimit(e.target.value)} title="Order Limit" />
                        <input className="input-field" type="number" placeholder="Staff Limit" value={staffLimit} onChange={(e) => setStaffLimit(e.target.value)} title="Staff Limit" />
                    </div>
                    <button type="submit" className="btn btn-primary">Add Plan</button>
                </form>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                    {plans.map(plan => (
                        <div key={plan.id} className="card" style={{ borderTop: '4px solid var(--primary)' }}>
                            <h4 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>{plan.name}</h4>
                            <div style={{ marginBottom: '1rem' }}>
                                <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>${plan.price_monthly}</span>
                                <span className="text-muted"> / month</span>
                            </div>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <span style={{ fontWeight: '600' }}>${plan.price_yearly}</span>
                                <span className="text-muted"> / year</span>
                            </div>
                            <ul style={{ listStyle: 'none', padding: 0, fontSize: '0.875rem' }}>
                                <li style={{ marginBottom: '0.5rem' }}>✓ Core Modules</li>
                                <li style={{ marginBottom: '0.5rem' }}>📦 {plan.product_limit === -1 ? 'Unlimited' : plan.product_limit} Products</li>
                                <li style={{ marginBottom: '0.5rem' }}>🛒 {plan.order_limit === -1 ? 'Unlimited' : plan.order_limit} Orders</li>
                                <li style={{ marginBottom: '0.5rem' }}>👥 {plan.staff_limit === -1 ? 'Unlimited' : plan.staff_limit} Staff</li>
                                <li style={{ color: 'var(--text-muted)' }}>{plan.description || 'Flexible platform access'}</li>
                            </ul>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Plans;
