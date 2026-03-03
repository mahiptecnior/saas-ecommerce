import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = ({ allowedRoles, children }) => {
    const user = JSON.parse(localStorage.getItem('user'));

    // Check if user is logged in
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // Check if user has the required role
    if (allowedRoles && !allowedRoles.includes(user.role)) {
        // Redirect to their respective dashboards if they have the wrong role
        if (user.role === 'super_admin') return <Navigate to="/admin" replace />;
        if (user.role === 'tenant_owner') return <Navigate to="/tenant" replace />;
        return <Navigate to="/login" replace />;
    }

    // Return the protected component
    return children ? children : <Outlet />;
};

export default ProtectedRoute;
