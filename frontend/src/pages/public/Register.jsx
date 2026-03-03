import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api/axios';

const Register = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        storeName: '',
        subdomain: '',
    });
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    // Auto-generate a subdomain hint based on store name
    const handleStoreNameChange = (e) => {
        const val = e.target.value;
        const suggestedSubdomain = val.toLowerCase().replace(/[^a-z0-9]/g, '');
        setFormData({
            ...formData,
            storeName: val,
            subdomain: suggestedSubdomain
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const { data } = await api.post('/auth/register', formData);
            if (data.success) {
                setSuccess(true);
                setTimeout(() => navigate('/login'), 3000);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to register. Subdomain or email might already be taken.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: 'var(--background)' }}>
                <div className="card" style={{ padding: '3rem', textAlign: 'center', maxWidth: '500px' }}>
                    <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
                    <h2 style={{ fontSize: '2rem', marginBottom: '1rem', color: 'var(--success)' }}>Registration Successful!</h2>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
                        Your store <strong>{formData.storeName}</strong> has been created.
                    </p>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Redirecting to login...</p>
                </div>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--background)' }}>

            {/* Left side: Branding / Info */}
            <div style={{ flex: 1, backgroundColor: 'var(--surface)', padding: '4rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', borderRight: '1px solid var(--border)', backgroundImage: 'linear-gradient(to bottom right, var(--surface), var(--background))' }}>
                <Link to="/" style={{ textDecoration: 'none' }}>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--primary)', letterSpacing: '-1px', marginBottom: '2rem' }}>Nazmart</h1>
                </Link>
                <h2 style={{ fontSize: '2rem', marginBottom: '1rem', lineHeight: '1.2' }}>Start building your <br />eCommerce business.</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginBottom: '2rem', maxWidth: '400px', lineHeight: '1.6' }}>
                    Join thousands of merchants who trust Nazmart to power their online stores. No credit card required to start.
                </p>
                <ul style={{ listStyle: 'none', padding: 0, color: 'var(--text-muted)' }}>
                    <li style={{ marginBottom: '1rem' }}>✓ 14-day free trial on all plans</li>
                    <li style={{ marginBottom: '1rem' }}>✓ Instant store generation</li>
                    <li style={{ marginBottom: '1rem' }}>✓ 24/7 dedicated support</li>
                </ul>
            </div>

            {/* Right side: Registration Form */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
                <div className="card" style={{ width: '100%', maxWidth: '500px', padding: '2.5rem' }}>
                    <h2 style={{ fontSize: '1.75rem', marginBottom: '0.5rem', textAlign: 'center' }}>Create an Account</h2>
                    <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginBottom: '2rem' }}>Fill in the details below to get started.</p>

                    {error && <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>{error}</div>}

                    <form onSubmit={handleSubmit}>
                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '500' }}>Full Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    className="input-field"
                                    required
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="John Doe"
                                />
                            </div>
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '500' }}>Email Address</label>
                            <input
                                type="email"
                                name="email"
                                className="input-field"
                                required
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="john@example.com"
                            />
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '500' }}>Password</label>
                            <input
                                type="password"
                                name="password"
                                className="input-field"
                                required
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="••••••••"
                                minLength="6"
                            />
                        </div>

                        <hr style={{ borderTop: '1px solid var(--border)', margin: '2rem 0' }} />

                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '500' }}>Store Name</label>
                            <input
                                type="text"
                                className="input-field"
                                required
                                value={formData.storeName}
                                onChange={handleStoreNameChange}
                                placeholder="My Awesome Store"
                            />
                        </div>

                        <div style={{ marginBottom: '2rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '500' }}>Store URL (Subdomain)</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <input
                                    type="text"
                                    name="subdomain"
                                    className="input-field"
                                    required
                                    value={formData.subdomain}
                                    onChange={handleChange}
                                    placeholder="mystore"
                                    style={{ flex: 1 }}
                                />
                                <span style={{ color: 'var(--text-muted)' }}>.nazmart.com</span>
                            </div>
                        </div>

                        <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.9rem', fontSize: '1rem' }} disabled={loading}>
                            {loading ? 'Creating Store...' : 'Register Now'}
                        </button>
                    </form>

                    <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Already have an account? </span>
                        <Link to="/login" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: '500' }}>Log In</Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
