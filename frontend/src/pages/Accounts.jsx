import React, { useState, useEffect } from 'react';
import api from '../api/axios';

const Accounts = () => {
    const [summary, setSummary] = useState({ totalRevenue: 0, totalExpenses: 0, netProfit: 0 });
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAccountData();
    }, []);

    const fetchAccountData = async () => {
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

    return (
        <div className="fade-in">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <div className="card">
                    <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Total Revenue</p>
                    <h2 style={{ color: 'var(--success)' }}>${summary.totalRevenue.toLocaleString()}</h2>
                </div>
                <div className="card">
                    <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Total Expenses</p>
                    <h2 style={{ color: 'var(--error)' }}>${summary.totalExpenses.toLocaleString()}</h2>
                </div>
                <div className="card">
                    <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Net Profit</p>
                    <h2 style={{ color: 'var(--primary)' }}>${summary.netProfit.toLocaleString()}</h2>
                </div>
            </div>

            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2>Recent Expenses</h2>
                    <button className="btn btn-primary">Add Expense</button>
                </div>
                <table className="table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Category</th>
                            <th>Description</th>
                            <th>Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {expenses.map((expense) => (
                            <tr key={expense.id}>
                                <td>{new Date(expense.date).toLocaleDateString()}</td>
                                <td>{expense.category}</td>
                                <td>{expense.description}</td>
                                <td style={{ color: 'var(--error)' }}>-${expense.amount}</td>
                            </tr>
                        ))}
                        {expenses.length === 0 && (
                            <tr>
                                <td colSpan="4" style={{ textAlign: 'center', padding: '2rem' }}>No expenses recorded.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Accounts;
