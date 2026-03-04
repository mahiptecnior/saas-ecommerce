import React, { useState, useEffect } from 'react';
import api from '../api/axios';

const Accounts = () => {
    const [summary, setSummary] = useState({ totalRevenue: 0, totalExpenses: 0, netProfit: 0 });
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ category: '', amount: '', description: '', date: '' });
    const [msg, setMsg] = useState('');

    useEffect(() => { fetchAccountData(); }, []);

    const fetchAccountData = async () => {
        setLoading(true);
        try {
            const [summaryRes, expensesRes] = await Promise.all([
                api.get('/modules/accounts/summary'),
                api.get('/modules/accounts/expenses')
            ]);
            setSummary(summaryRes.data.data);
            setExpenses(expensesRes.data.data);
        } catch (error) {
            console.error('Error fetching account data', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddExpense = async (e) => {
        e.preventDefault();
        try {
            await api.post('/modules/accounts/expenses', form);
            setForm({ category: '', amount: '', description: '', date: '' });
            setShowModal(false);
            setMsg('Expense added successfully!');
            fetchAccountData();
            setTimeout(() => setMsg(''), 3000);
        } catch (err) { alert('Error adding expense'); }
    };

    return (
        <div className="fade-in">
            {msg && <div style={{ padding: '0.75rem', backgroundColor: 'var(--success)', color: '#fff', borderRadius: '8px', marginBottom: '1rem' }}>{msg}</div>}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <div className="card">
                    <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.85rem' }}>Total Revenue</p>
                    <h2 style={{ color: 'var(--success)' }}>${Number(summary.totalRevenue).toLocaleString()}</h2>
                </div>
                <div className="card">
                    <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.85rem' }}>Total Expenses</p>
                    <h2 style={{ color: 'var(--danger)' }}>${Number(summary.totalExpenses).toLocaleString()}</h2>
                </div>
                <div className="card">
                    <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.85rem' }}>Net Profit</p>
                    <h2 style={{ color: 'var(--primary)' }}>${Number(summary.netProfit).toLocaleString()}</h2>
                </div>
            </div>

            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2>Recent Expenses</h2>
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Add Expense</button>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
                            <th style={{ padding: '0.75rem' }}>Date</th>
                            <th style={{ padding: '0.75rem' }}>Category</th>
                            <th style={{ padding: '0.75rem' }}>Description</th>
                            <th style={{ padding: '0.75rem' }}>Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="4" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</td></tr>
                        ) : expenses.length === 0 ? (
                            <tr><td colSpan="4" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No expenses recorded.</td></tr>
                        ) : expenses.map(expense => (
                            <tr key={expense.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                <td style={{ padding: '0.75rem', fontSize: '0.85rem' }}>{new Date(expense.date).toLocaleDateString()}</td>
                                <td style={{ padding: '0.75rem' }}><span className="badge badge-active">{expense.category}</span></td>
                                <td style={{ padding: '0.75rem' }}>{expense.description}</td>
                                <td style={{ padding: '0.75rem', color: 'var(--danger)', fontWeight: '600' }}>-${Number(expense.amount).toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* ADD EXPENSE MODAL */}
            {showModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="card" style={{ width: '450px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <h3>Add Expense</h3>
                            <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem' }}>&times;</button>
                        </div>
                        <form onSubmit={handleAddExpense} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.3rem' }}>Category</label>
                                    <select className="input-field" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} required>
                                        <option value="">Select...</option>
                                        <option value="Rent">Rent</option>
                                        <option value="Utilities">Utilities</option>
                                        <option value="Salary">Salary</option>
                                        <option value="Marketing">Marketing</option>
                                        <option value="Supplies">Supplies</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.3rem' }}>Amount ($)</label>
                                    <input className="input-field" type="number" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required />
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.3rem' }}>Description</label>
                                <input className="input-field" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required placeholder="Brief expense description" />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.3rem' }}>Date</label>
                                <input className="input-field" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required />
                            </div>
                            <button type="submit" className="btn btn-primary">Add Expense</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Accounts;
