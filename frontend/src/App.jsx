import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Layout from './components/Layout';
import Tenants from './pages/Tenants';
import Products from './pages/Products';
import Orders from './pages/Orders';
import Plans from './pages/Plans';
import AdminDashboard from './pages/AdminDashboard';
import TenantDashboard from './pages/TenantDashboard';

function App() {
  const user = JSON.parse(localStorage.getItem('user'));

  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      {/* Super Admin Protected Routes */}
      <Route path="/admin" element={<Layout role="super_admin" />}>
        <Route index element={<AdminDashboard />} />
        <Route path="tenants" element={<Tenants />} />
        <Route path="plans" element={<Plans />} />
      </Route>

      {/* Tenant Protected Routes */}
      <Route path="/dashboard" element={<Layout role="tenant_owner" />}>
        <Route index element={<TenantDashboard />} />
        <Route path="products" element={<Products />} />
        <Route path="orders" element={<Orders />} />
        <Route path="settings" element={<div>Settings Management</div>} />
      </Route>

      <Route path="/" element={<Navigate to="/login" />} />
    </Routes>
  );
}

export default App;
