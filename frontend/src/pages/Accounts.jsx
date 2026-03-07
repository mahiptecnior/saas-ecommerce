import React, { useState, useEffect } from 'react';
import api from '../api/axios';

const Accounts = () => {
    const [activeTab, setActiveTab] = useState('coa');
    const [accounts, setAccounts] = useState([]);
    const [journals, setJournals] = useState([]);
    const [reports, setReports] = useState({ balanceSheet: null });
    const [loading, setLoading] = useState(true);

    // Modals
    const [showAccountModal, setShowAccountModal] = useState(false);
    const [showJournalModal, setShowJournalModal] = useState(false);

    // Forms
    const [accountForm, setAccountForm] = useState({ name: '', code: '', type: 'asset', parent_id: '' });
    const [journalForm, setJournalForm] = useState({
        description: '',
        reference: '',
        date: new Date().toISOString().split('T')[0],
        entries: [
            { account_id: '', debit: '', credit: '' },
            { account_id: '', debit: '', credit: '' }
        ]
    });

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'coa') {
                const res = await api.get('/accounting/accounts');
                setAccounts(res.data.data);
            } else if (activeTab === 'journals') {
                const res = await api.get('/accounting/journals');
                setJournals(res.data.data);
                // Also need accounts for dropdowns in modal
                const accRes = await api.get('/accounting/accounts');
                setAccounts(accRes.data.data);
            } else if (activeTab === 'reports') {
                const res = await api.get('/accounting/reports/balance-sheet');
                setReports({ balanceSheet: res.data.data });
            }
        } catch (error) {
            console.error('Error fetching accounting data', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateAccount = async (e) => {
        e.preventDefault();
        try {
            await api.post('/accounting/accounts', accountForm);
            alert('Account created successfully!');
            setShowAccountModal(false);
            setAccountForm({ name: '', code: '', type: 'asset', parent_id: '' });
            fetchData();
        } catch (error) {
            alert('Error creating account');
        }
    };

    const handleCreateJournal = async (e) => {
        e.preventDefault();
        // Validation: debits must equal credits
        const totalDebit = journalForm.entries.reduce((sum, en) => sum + parseFloat(en.debit || 0), 0);
        const totalCredit = journalForm.entries.reduce((sum, en) => sum + parseFloat(en.credit || 0), 0);

        if (totalDebit !== totalCredit || totalDebit === 0) {
            alert(`Journal must balance! Debits ($${totalDebit}) must equal Credits ($${totalCredit}).`);
            return;
        }

        try {
            await api.post('/accounting/journals', journalForm);
            alert('Journal entry posted!');
            setShowJournalModal(false);
            setJournalForm({
                description: '', reference: '', date: new Date().toISOString().split('T')[0],
                entries: [{ account_id: '', debit: '', credit: '' }, { account_id: '', debit: '', credit: '' }]
            });
            fetchData();
        } catch (error) {
            alert('Error posting journal');
        }
    };

    const addJournalRow = () => {
        setJournalForm({
            ...journalForm,
            entries: [...journalForm.entries, { account_id: '', debit: '', credit: '' }]
        });
    };

    const updateJournalEntry = (index, field, value) => {
        const newEntries = [...journalForm.entries];
        newEntries[index][field] = value;
        setJournalForm({ ...journalForm, entries: newEntries });
    };

    if (loading) return <div className="fade-in">Loading Accounting...</div>;

    return (
        <div className="fade-in">
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)' }}>
                <button
                    className={`btn ${activeTab === 'coa' ? 'btn-primary' : ''}`}
                    style={{ backgroundColor: activeTab === 'coa' ? 'var(--primary)' : 'transparent', color: activeTab === 'coa' ? 'white' : 'var(--text)', border: 'none', borderRadius: '4px 4px 0 0', padding: '0.75rem 1.5rem' }}
                    onClick={() => setActiveTab('coa')}
                >
                    Chart of Accounts
                </button>
                <button
                    className={`btn ${activeTab === 'journals' ? 'btn-primary' : ''}`}
                    style={{ backgroundColor: activeTab === 'journals' ? 'var(--primary)' : 'transparent', color: activeTab === 'journals' ? 'white' : 'var(--text)', border: 'none', borderRadius: '4px 4px 0 0', padding: '0.75rem 1.5rem' }}
                    onClick={() => setActiveTab('journals')}
                >
                    Journal Entries
                </button>
                <button
                    className={`btn ${activeTab === 'reports' ? 'btn-primary' : ''}`}
                    style={{ backgroundColor: activeTab === 'reports' ? 'var(--primary)' : 'transparent', color: activeTab === 'reports' ? 'white' : 'var(--text)', border: 'none', borderRadius: '4px 4px 0 0', padding: '0.75rem 1.5rem' }}
                    onClick={() => setActiveTab('reports')}
                >
                    Reports
                </button>
            </div>

            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2>
                        {activeTab === 'coa' ? 'Chart of Accounts' : activeTab === 'journals' ? 'Double-Entry Journal' : 'Financial Reports'}
                    </h2>
                    {activeTab === 'coa' && (
                        <button className="btn btn-primary" onClick={() => setShowAccountModal(true)}>+ New Account</button>
                    )}
                    {activeTab === 'journals' && (
                        <button className="btn btn-primary" onClick={() => setShowJournalModal(true)}>+ New Journal Entry</button>
                    )}
                </div>

                {/* COA TAB */}
                {activeTab === 'coa' && (
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Code</th>
                                <th>Name</th>
                                <th>Type</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {accounts.map(acc => (
                                <tr key={acc.id}>
                                    <td style={{ fontWeight: '600' }}>{acc.code}</td>
                                    <td>{acc.name}</td>
                                    <td><span style={{ textTransform: 'uppercase', fontSize: '0.8rem', padding: '0.2rem 0.5rem', backgroundColor: 'var(--surface)', borderRadius: '4px' }}>{acc.type}</span></td>
                                    <td>{acc.is_active ? '✅ Active' : '❌ Inactive'}</td>
                                </tr>
                            ))}
                            {accounts.length === 0 && <tr><td colSpan="4" style={{ textAlign: 'center', padding: '2rem' }}>No accounts found. Create your first ledger account.</td></tr>}
                        </tbody>
                    </table>
                )}

                {/* JOURNALS TAB */}
                {activeTab === 'journals' && (
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Description</th>
                                <th>Reference</th>
                                <th>Debit/Credit Summary</th>
                            </tr>
                        </thead>
                        <tbody>
                            {journals.map(j => {
                                const total = (j.entries || []).reduce((sum, e) => sum + parseFloat(e.debit || 0), 0);
                                return (
                                    <tr key={j.id}>
                                        <td>{new Date(j.date).toLocaleDateString()}</td>
                                        <td>{j.description}</td>
                                        <td>{j.reference || '-'}</td>
                                        <td style={{ fontWeight: '600' }}>${total.toFixed(2)}</td>
                                    </tr>
                                );
                            })}
                            {journals.length === 0 && <tr><td colSpan="4" style={{ textAlign: 'center', padding: '2rem' }}>No journal entries yet.</td></tr>}
                        </tbody>
                    </table>
                )}

                {/* REPORTS TAB */}
                {activeTab === 'reports' && reports.balanceSheet && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                        <div>
                            <h4 style={{ borderBottom: '2px solid var(--primary)', paddingBottom: '0.5rem' }}>Assets</h4>
                            {reports.balanceSheet.assets.map(a => (
                                <div key={a.code} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0' }}>
                                    <span>{a.code} - {a.name}</span>
                                    <span style={{ fontWeight: '600' }}>${(parseFloat(a.total_debit || 0) - parseFloat(a.total_credit || 0)).toFixed(2)}</span>
                                </div>
                            ))}
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem 0', borderTop: '1px solid var(--border)', fontWeight: '700' }}>
                                <span>Total Assets</span>
                                <span>${reports.balanceSheet.assets.reduce((sum, a) => sum + (parseFloat(a.total_debit || 0) - parseFloat(a.total_credit || 0)), 0).toFixed(2)}</span>
                            </div>
                        </div>
                        <div>
                            <h4 style={{ borderBottom: '2px solid var(--error)', paddingBottom: '0.5rem' }}>Liabilities & Equity</h4>
                            {reports.balanceSheet.liabilities.map(a => (
                                <div key={a.code} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0' }}>
                                    <span>{a.code} - {a.name}</span>
                                    <span style={{ fontWeight: '600' }}>${(parseFloat(a.total_credit || 0) - parseFloat(a.total_debit || 0)).toFixed(2)}</span>
                                </div>
                            ))}
                            {reports.balanceSheet.equity.map(a => (
                                <div key={a.code} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', fontStyle: 'italic' }}>
                                    <span>{a.code} - {a.name}</span>
                                    <span style={{ fontWeight: '600' }}>${(parseFloat(a.total_credit || 0) - parseFloat(a.total_debit || 0)).toFixed(2)}</span>
                                </div>
                            ))}
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem 0', borderTop: '1px solid var(--border)', fontWeight: '700' }}>
                                <span>Total Liabilities & Equity</span>
                                <span>${(
                                    reports.balanceSheet.liabilities.reduce((sum, a) => sum + (parseFloat(a.total_credit || 0) - parseFloat(a.total_debit || 0)), 0) +
                                    reports.balanceSheet.equity.reduce((sum, a) => sum + (parseFloat(a.total_credit || 0) - parseFloat(a.total_debit || 0)), 0)
                                ).toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Account Modal */}
            {showAccountModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                    <div className="card" style={{ width: '450px' }}>
                        <h3>Create Ledger Account</h3>
                        <form onSubmit={handleCreateAccount} style={{ marginTop: '1rem' }}>
                            <div className="form-group">
                                <label>Account Name *</label>
                                <input type="text" className="form-control" value={accountForm.name} onChange={e => setAccountForm({ ...accountForm, name: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label>Account Code *</label>
                                <input type="text" className="form-control" placeholder="e.g. 1001" value={accountForm.code} onChange={e => setAccountForm({ ...accountForm, code: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label>Account Type *</label>
                                <select className="form-control" value={accountForm.type} onChange={e => setAccountForm({ ...accountForm, type: e.target.value })} required>
                                    <option value="asset">Asset</option>
                                    <option value="liability">Liability</option>
                                    <option value="equity">Equity</option>
                                    <option value="revenue">Revenue</option>
                                    <option value="expense">Expense</option>
                                </select>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                                <button type="button" className="btn" onClick={() => setShowAccountModal(false)} style={{ flex: 1 }}>Cancel</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save Account</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Journal Modal */}
            {showJournalModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                    <div className="card" style={{ width: '700px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <h3>New Journal Entry</h3>
                        <form onSubmit={handleCreateJournal} style={{ marginTop: '1rem' }}>
                            <div className="form-group">
                                <label>Description</label>
                                <input type="text" className="form-control" value={journalForm.description} onChange={e => setJournalForm({ ...journalForm, description: e.target.value })} required />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label>Reference</label>
                                    <input type="text" className="form-control" value={journalForm.reference} onChange={e => setJournalForm({ ...journalForm, reference: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Date</label>
                                    <input type="date" className="form-control" value={journalForm.date} onChange={e => setJournalForm({ ...journalForm, date: e.target.value })} required />
                                </div>
                            </div>

                            <table className="table" style={{ fontSize: '0.9rem' }}>
                                <thead>
                                    <tr>
                                        <th>Account</th>
                                        <th style={{ width: '120px' }}>Debit</th>
                                        <th style={{ width: '120px' }}>Credit</th>
                                        <th style={{ width: '40px' }}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {journalForm.entries.map((en, idx) => (
                                        <tr key={idx}>
                                            <td>
                                                <select className="form-control form-control-sm" value={en.account_id} onChange={e => updateJournalEntry(idx, 'account_id', e.target.value)} required>
                                                    <option value="">Select Account</option>
                                                    {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>)}
                                                </select>
                                            </td>
                                            <td><input type="number" step="0.01" className="form-control form-control-sm" value={en.debit} onChange={e => updateJournalEntry(idx, 'debit', e.target.value)} /></td>
                                            <td><input type="number" step="0.01" className="form-control form-control-sm" value={en.credit} onChange={e => updateJournalEntry(idx, 'credit', e.target.value)} /></td>
                                            <td><button type="button" className="btn btn-sm" style={{ color: 'red' }} onClick={() => setJournalForm({ ...journalForm, entries: journalForm.entries.filter((_, i) => i !== idx) })}>×</button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <button type="button" className="btn btn-sm btn-outline" onClick={addJournalRow} style={{ marginBottom: '1rem' }}>+ Add Row</button>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                                <button type="button" className="btn" onClick={() => setShowJournalModal(false)} style={{ flex: 1 }}>Cancel</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Post Journal Entry</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Accounts;
