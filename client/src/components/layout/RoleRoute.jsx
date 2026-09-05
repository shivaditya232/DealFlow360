import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// Guards a page by role, on top of ProtectedRoute's login check. A role
// that isn't allowed here never sees the page (or its loading/error
// states) — it's redirected before the page ever mounts or fetches.
export default function RoleRoute({ roles, children }) {
  const { user } = useAuth();
  if (roles && !roles.includes(user?.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}
