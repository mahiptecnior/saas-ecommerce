import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';

const Landing = () => {
    const navigate = useNavigate();
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPlans = async () => {
            try {
                const { data } = await api.get('/public/plans');
                // Filter out plans with no name or duplicate test plans if necessary, 
                // but for now we display all active formatted plans.
                setPlans(data.data);
            } catch (err) {
                console.error("Failed to fetch public plans:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchPlans();
    }, []);

    return (
        <div style={{ fontFamily: 'var(--font-family)', backgroundColor: 'var(--background)', minHeight: '100vh', color: 'var(--text)' }}>
            {/* Header / Navbar */}
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem 5%', backgroundColor: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--primary)', letterSpacing: '-0.5px' }}>
                    Nazmart
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button className="btn btn-outline" onClick={() => navigate('/login')}>Log In</button>
                    <button className="btn btn-primary" onClick={() => navigate('/register')}>Start Free Trial</button>
                </div>
            </header>

            {/* Hero Section */}
            <section style={{ textAlign: 'center', padding: '6rem 2rem', backgroundColor: 'var(--surface)', backgroundImage: 'linear-gradient(to bottom, var(--surface), var(--background))' }}>
                <h1 style={{ fontSize: '3.5rem', fontWeight: '800', marginBottom: '1.5rem', lineHeight: '1.2', color: 'var(--text)' }}>
                    Launch Your <span style={{ color: 'var(--primary)' }}>SaaS eCommerce</span> Empire
                </h1>
                <p style={{ fontSize: '1.25rem', color: 'var(--text-muted)', maxWidth: '600px', margin: '0 auto 2.5rem', lineHeight: '1.6' }}>
                    The all-in-one multi-tenant platform for building, managing, and scaling your online stores. No coding required. Start selling in minutes.
                </p>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                    <button className="btn btn-primary" style={{ padding: '0.75rem 2rem', fontSize: '1.1rem' }} onClick={() => navigate('/register')}>
                        Get Started Today
                    </button>
                </div>
            </section>

            {/* Features Section */}
            <section style={{ padding: '5rem 5%' }}>
                <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '1rem' }}>Everything You Need to Succeed</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Powerful modules designed to help you sell more and manage less.</p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
                    {[
                        { icon: '🛍️', title: 'Product Management', desc: 'Easily add, edit, and organize your inventory with categories and variants.' },
                        { icon: '💳', title: 'Secure Payments', desc: 'Integrated payment gateways like Stripe and PayPal for seamless checkout.' },
                        { icon: '📈', title: 'Sales Analytics', desc: 'Detailed reporting and transaction logs to monitor your business growth.' },
                        { icon: '🎨', title: 'Theme Builder', desc: 'Customize your storefront with our intuitive drag-and-drop theme editor.' },
                        { icon: '👥', title: 'Staff Accounts', desc: 'Delegate tasks safely with role-based access for your team members.' },
                        { icon: '🚀', title: 'Marketing Tools', desc: 'Built-in SEO and promotional campaigns to drive traffic to your store.' },
                    ].map((feature, i) => (
                        <div key={i} className="card" style={{ padding: '2rem', textAlign: 'center', transition: 'transform 0.2s', cursor: 'default' }} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{feature.icon}</div>
                            <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>{feature.title}</h3>
                            <p style={{ color: 'var(--text-muted)', lineHeight: '1.5' }}>{feature.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Pricing Section */}
            <section style={{ padding: '5rem 5%', backgroundColor: 'var(--surface)' }} id="pricing">
                <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '1rem' }}>Simple, Transparent Pricing</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Choose the perfect plan for your business size.</p>
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '3rem' }}>Loading plans...</div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', maxWidth: '1200px', margin: '0 auto', alignItems: 'center' }}>
                        {plans.length > 0 ? plans.map(plan => (
                            <div key={plan.id} className="card" style={{
                                padding: '2.5rem',
                                borderTop: `5px solid ${plan.price_monthly > 0 ? 'var(--primary)' : 'var(--text-muted)'}`,
                                transform: plan.price_monthly > 40 ? 'scale(1.05)' : 'scale(1)',
                                zIndex: plan.price_monthly > 40 ? 1 : 0
                            }}>
                                {plan.price_monthly > 40 && <div style={{ position: 'absolute', top: '-15px', left: '50%', transform: 'translateX(-50%)', backgroundColor: 'var(--primary)', color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold' }}>MOST POPULAR</div>}
                                <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{plan.name}</h3>
                                {plan.description && <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>{plan.description}</p>}
                                <div style={{ marginBottom: '2rem' }}>
                                    <span style={{ fontSize: '3rem', fontWeight: '800' }}>${plan.price_monthly}</span>
                                    <span style={{ color: 'var(--text-muted)' }}>/mo</span>
                                </div>

                                <button className={plan.price_monthly > 40 ? "btn btn-primary" : "btn btn-outline"} style={{ width: '100%', marginBottom: '2rem', padding: '0.75rem' }} onClick={() => navigate('/register')}>
                                    Start with {plan.name}
                                </button>

                                <div style={{ fontSize: '0.9rem' }}>
                                    <p style={{ fontWeight: '600', marginBottom: '1rem' }}>Plan Limits:</p>
                                    <ul style={{ listStyle: 'none', padding: 0, marginBottom: '2rem' }}>
                                        <li style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span style={{ color: 'var(--success)' }}>✓</span> {plan.product_limit === -1 ? 'Unlimited' : plan.product_limit} Products
                                        </li>
                                        <li style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span style={{ color: 'var(--success)' }}>✓</span> {plan.order_limit === -1 ? 'Unlimited' : plan.order_limit} Orders/mo
                                        </li>
                                        <li style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span style={{ color: 'var(--success)' }}>✓</span> {plan.staff_limit === -1 ? 'Unlimited' : plan.staff_limit} Staff Accounts
                                        </li>
                                    </ul>

                                    <p style={{ fontWeight: '600', marginBottom: '1rem' }}>Included Features:</p>
                                    <ul style={{ listStyle: 'none', padding: 0 }}>
                                        {plan.modules && plan.modules.map((mod, idx) => (
                                            <li key={idx} style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', textTransform: 'capitalize' }}>
                                                <span style={{ color: 'var(--primary)' }}>✦</span> {mod} Module
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        )) : (
                            <div style={{ textAlign: 'center', gridColumn: '1 / -1', color: 'var(--text-muted)' }}>No pricing plans created yet. Please check back later.</div>
                        )}
                    </div>
                )}
            </section>

            {/* Footer */}
            <footer style={{ textAlign: 'center', padding: '3rem', borderTop: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                <p>&copy; {new Date().getFullYear()} Nazmart Multi-Tenant SaaS. All rights reserved.</p>
            </footer>
        </div>
    );
};

export default Landing;
