import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Role-Based Route Guard
 * 
 * Supports exact backend roles:
 * - Internal roles: 'SALES_REP' | 'MANAGER' | 'FINANCE' | 'ADMIN'
 * - Customer: accountType === 'CUSTOMER' (role is null)
 */
export default function RoleGuard({
  allowedRoles = [],
  allowCustomer = false,
  children
}) {
  const { accountType, role, landing } = useAuth();

  // If customer is accessing an internal-only route
  if (accountType === 'CUSTOMER' && !allowCustomer) {
    return <Navigate to="/portal" replace />;
  }

  // If internal user is accessing a customer-only route
  if (accountType === 'INTERNAL' && allowCustomer && allowedRoles.length === 0) {
    return <Navigate to="/dashboard" replace />;
  }

  // If internal route requires specific roles
  if (allowedRoles.length > 0 && (!role || !allowedRoles.includes(role))) {
    const fallback = landing === 'PORTAL' ? '/portal' : '/dashboard';
    return <Navigate to={fallback} replace />;
  }

  return children ? children : <Outlet />;
}
