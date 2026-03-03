import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Layout from './components/Layout';
import Tenants from './pages/Tenants';
import Products from './pages/Products';
import Orders from './pages/Orders';
import Marketing from './pages/Marketing';
import Accounts from './pages/Accounts';
import Support from './pages/Support';
import Settings from './pages/Settings';
import Plans from './pages/Plans';
import ThemeBuilder from './pages/ThemeBuilder';
import Categories from './pages/Categories';
import SystemManagement from './pages/SystemManagement';
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
        <Route path="system" element={<SystemManagement />} />
      </Route>

      {/* Tenant Protected Routes */}
      <Route path="/dashboard" element={<Layout role="tenant_owner" />}>
        <Route index element={<TenantDashboard />} />
        <Route path="products" element={<Products />} />
        <Route path="categories" element={<Categories />} />
        <Route path="orders" element={<Orders />} />
        <Route path="marketing" element={<Marketing />} />
        <Route path="accounts" element={<Accounts />} />
        <Route path="support" element={<Support />} />
        <Route path="builder" element={<ThemeBuilder />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      <Route path="/" element={<Navigate to="/login" />} />
    </Routes>
  );
}

export default App;
