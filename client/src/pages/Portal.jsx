import React from 'react';
import CustomerPortalShell from '../components/customer-portal/CustomerPortalShell';

/**
 * Portal Page
 * 
 * Route: /portal
 * Guard: ProtectedRoute + RoleGuard (allowCustomer=true)
 * 
 * Access check:
 *   accountType === 'CUSTOMER' → allowed
 *   accountType === 'INTERNAL' → RoleGuard redirects to /dashboard
 *   unauthenticated            → ProtectedRoute redirects to /login
 * 
 * This page is a thin wrapper. All portal logic lives in CustomerPortalShell.
 */
export default function Portal() {
  return <CustomerPortalShell />;
}
