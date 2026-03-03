import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Landing from './pages/public/Landing';
import Register from './pages/public/Register';
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
import PlatformSettings from './pages/PlatformSettings';
import TenantDashboard from './pages/TenantDashboard';
import AdminGateways from './pages/AdminGateways';
import AdminTransactions from './pages/AdminTransactions';
import AdminModules from './pages/AdminModules';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  const user = JSON.parse(localStorage.getItem('user'));

  return (
    <Routes>
      {/* Public Pages */}
      <Route path="/" element={<Landing />} />
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />

      {/* Platform Super Admin Routes */}
      <Route path="/admin" element={
        <ProtectedRoute allowedRoles={['super_admin']}>
          <Layout role="super_admin" />
        </ProtectedRoute>
      }>
        <Route index element={<AdminDashboard />} />
        <Route path="tenants" element={<Tenants />} />
        <Route path="plans" element={<Plans />} />
        <Route path="modules" element={<AdminModules />} />
        <Route path="assignments" element={<SystemManagement />} />
        <Route path="platform-settings" element={<PlatformSettings />} />
        <Route path="gateways" element={<AdminGateways />} />
        <Route path="transactions" element={<AdminTransactions />} />
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
      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;
