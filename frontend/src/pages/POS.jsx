import React, { useState, useEffect, useMemo } from 'react';
import api from '../api/axios';

const POS = () => {
    const [products, setProducts] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);

    const [cart, setCart] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [msg, setMsg] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [prodRes, custRes] = await Promise.all([
                    api.get('/products'),
                    api.get('/customers')
                ]);
                setProducts(prodRes.data.data);
                setCustomers(custRes.data.data);
            } catch (error) {
                console.error('Error fetching POS data', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const customerTier = selectedCustomer ? customers.find(c => c.id === parseInt(selectedCustomer))?.tier || 'retail' : 'retail';

    // Get the applicable price for a variant based on the current tier
    const getPrice = (product, variant) => {
        const basePrice = parseFloat(variant?.price || product.price);
        if (customerTier === 'retail') return basePrice;

        const b2b = variant?.b2b_pricing || [];
        const tierPrice = b2b.find(b => b.tier === customerTier);
        return tierPrice ? parseFloat(tierPrice.price) : basePrice;
    };

    const addToCart = (product, variant) => {
        const price = getPrice(product, variant);
        const cartId = variant ? `${product.id}-${variant.id}` : `${product.id}`;

        const existing = cart.find(item => item.cartId === cartId);
        if (existing) {
            setCart(cart.map(item => item.cartId === cartId ? { ...item, quantity: item.quantity + 1 } : item));
        } else {
            setCart([...cart, {
                cartId,
                product_id: product.id,
                variant_id: variant?.id || null,
                name: product.name,
                variant_sku: variant?.variant_sku || '',
                price: price,
                quantity: 1
            }]);
        }
    };

    const updateQuantity = (cartId, qty) => {
        if (qty <= 0) {
            setCart(cart.filter(item => item.cartId !== cartId));
        } else {
            setCart(cart.map(item => item.cartId === cartId ? { ...item, quantity: qty } : item));
        }
    };

    const cartTotal = useMemo(() => {
        return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }, [cart]);

    const handleCheckout = async () => {
        if (cart.length === 0) return alert('Cart is empty');

        const payload = {
            customer_id: selectedCustomer || null,
            total_amount: cartTotal,
            source: 'pos',
            items: cart.map(item => ({
                product_id: item.product_id,
                variant_id: item.variant_id,
                quantity: item.quantity,
                unit_price: item.price
            }))
        };

        try {
            await api.post('/orders', payload);
            setMsg('Order completed successfully! 🚀');
            setCart([]);
            setSelectedCustomer(null);
            setTimeout(() => setMsg(''), 3000);
        } catch (error) {
            alert(error.response?.data?.message || 'Error processing checkout');
        }
    };

    const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku?.toLowerCase().includes(searchTerm.toLowerCase()));

    if (loading) return <div className="fade-in">Loading POS Terminal...</div>;

    return (
        <div className="fade-in" style={{ display: 'flex', height: 'calc(100vh - 120px)', gap: '1.5rem' }}>
            {/* Products Section (Left 65%) */}
            <div className="card" style={{ flex: '0 0 65%', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h2>Point of Sale (POS)</h2>
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Search products or SKU..."
                        style={{ width: '300px' }}
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>

                <div style={{ flex: 1, overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', alignContent: 'start' }}>
                    {filteredProducts.map(p => {
                        // If no variants, show as simple product click
                        if (!p.variants || p.variants.length === 0 || (p.variants.length === 1 && !p.variants[0].variant_sku)) {
                            return (
                                <div key={p.id} style={{ border: '1px solid var(--border)', borderRadius: '8px', padding: '1rem', cursor: 'pointer', transition: 'box-shadow 0.2s' }} onClick={() => addToCart(p, p.variants?.[0])}
                                    onMouseOver={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'}
                                    onMouseOut={e => e.currentTarget.style.boxShadow = 'none'}>
                                    <div style={{ fontWeight: '600', marginBottom: '0.5rem' }}>{p.name}</div>
                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>SKU: {p.sku || 'N/A'}</div>
                                    <div style={{ color: 'var(--primary)', fontWeight: 'bold' }}>${getPrice(p, p.variants?.[0])?.toFixed(2)}</div>
                                </div>
                            );
                        }

                        // Product with variants
                        return (
                            <div key={p.id} style={{ border: '1px solid var(--border)', borderRadius: '8px', padding: '1rem' }}>
                                <div style={{ fontWeight: '600', marginBottom: '0.5rem' }}>{p.name}</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {p.variants.map(v => (
                                        <button key={v.id} className="btn" style={{ fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between', padding: '0.4rem', border: '1px solid var(--border)', backgroundColor: 'var(--bg)' }} onClick={() => addToCart(p, v)}>
                                            <span>{v.variant_sku}</span>
                                            <span style={{ fontWeight: 'bold' }}>${getPrice(p, v)?.toFixed(2)}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Cart Section (Right 35%) */}
            <div className="card" style={{ flex: '1', display: 'flex', flexDirection: 'column', padding: '1.5rem', backgroundColor: 'var(--surface)' }}>
                {msg && <div style={{ padding: '0.75rem', backgroundColor: 'var(--success)', color: '#fff', borderRadius: '8px', marginBottom: '1rem', textAlign: 'center' }}>{msg}</div>}

                <h3 style={{ marginBottom: '1.5rem' }}>Current Order</h3>

                <div className="form-group">
                    <label>Select Customer</label>
                    <select className="form-control" value={selectedCustomer || ''} onChange={e => setSelectedCustomer(e.target.value)}>
                        <option value="">Walk-in Customer (Retail)</option>
                        {customers.map(c => <option key={c.id} value={c.id}>{c.name} - ({c.tier?.toUpperCase() || 'RETAIL'})</option>)}
                    </select>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', borderTop: '2px solid var(--border)', borderBottom: '2px solid var(--border)', padding: '1rem 0', margin: '1rem 0' }}>
                    {cart.length === 0 ? (
                        <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '2rem' }}>Cart is empty</div>
                    ) : (
                        cart.map(item => (
                            <div key={item.cartId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: '500' }}>{item.name}</div>
                                    {item.variant_sku && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.variant_sku}</div>}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <div style={{ fontWeight: '600', marginRight: '0.5rem' }}>${item.price.toFixed(2)}</div>
                                    <button className="btn" style={{ padding: '0 0.5rem' }} onClick={() => updateQuantity(item.cartId, item.quantity - 1)}>-</button>
                                    <span style={{ width: '20px', textAlign: 'center' }}>{item.quantity}</span>
                                    <button className="btn" style={{ padding: '0 0.5rem' }} onClick={() => updateQuantity(item.cartId, item.quantity + 1)}>+</button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div style={{ marginTop: 'auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
                        <span>Total:</span>
                        <span>${cartTotal.toFixed(2)}</span>
                    </div>
                    <button
                        className="btn btn-primary"
                        style={{ width: '100%', padding: '1rem', fontSize: '1.1rem', backgroundColor: 'var(--active)', border: 'none', color: 'white' }}
                        onClick={handleCheckout}
                    >
                        Checkout Order
                    </button>
                    <button
                        className="btn"
                        style={{ width: '100%', marginTop: '0.5rem', color: 'var(--danger)' }}
                        onClick={() => setCart([])}
                    >
                        Clear Cart
                    </button>
                </div>
            </div>
        </div>
    );
};

export default POS;
