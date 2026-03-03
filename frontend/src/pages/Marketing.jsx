import React, { useState, useEffect } from 'react';
import api from '../api/axios';

const Marketing = () => {
    const [coupons, setCoupons] = useState([]);

    const handleSendCampaign = (type) => {
        alert(`${type} Campaign Launched! 🚀 Users are being notified.`);
    };

    return (
        <div className="fade-in">
            <div className="card" style={{ marginBottom: '2rem' }}>
                <h2>Marketing Campaigns</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginTop: '1rem' }}>
                    <div className="card" style={{ backgroundColor: 'var(--background)' }}>
                        <h4>Email Blast</h4>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Send newsletter to all customers.</p>
                        <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => handleSendCampaign('Email')}>Launch</button>
                    </div>
                    <div className="card" style={{ backgroundColor: 'var(--background)' }}>
                        <h4>SMS Alert</h4>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Urgent discount alerts via SMS.</p>
                        <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => handleSendCampaign('SMS')}>Launch</button>
                    </div>
                    <div className="card" style={{ backgroundColor: 'var(--background)' }}>
                        <h4>Push Notification</h4>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Mobile app push alerts.</p>
                        <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => handleSendCampaign('Push')}>Launch</button>
                    </div>
                </div>
            </div>

            <div className="card">
                <h3>Coupons & Discounts</h3>
                <table className="table" style={{ marginTop: '1rem' }}>
                    <thead>
                        <tr>
                            <th>Code</th>
                            <th>Discount</th>
                            <th>Status</th>
                            <th>Usage</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>WELCOME10</td>
                            <td>10% OFF</td>
                            <td><span className="status-badge status-active">Active</span></td>
                            <td>45 times</td>
                        </tr>
                        <tr>
                            <td>SUMMER25</td>
                            <td>25% OFF</td>
                            <td><span className="status-badge status-active">Active</span></td>
                            <td>12 times</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Marketing;
