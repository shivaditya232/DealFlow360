import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import Dashboard from './pages/Dashboard';
import Portal from './pages/Portal';
import ProtectedRoute from './routes/ProtectedRoute';
import RoleGuard from './routes/RoleGuard';

/**
 * Root Index Dispatcher
 * Automatically routes users based on active session and landing type
 */
function RootRedirect() {
  const { isAuthenticated, landing, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={landing === 'PORTAL' ? '/portal' : '/dashboard'} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Protected Internal Workspace Dashboard */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['SALES_REP', 'MANAGER', 'FINANCE', 'ADMIN']}>
                  <Dashboard />
                </RoleGuard>
              </ProtectedRoute>
            }
          />

          {/* Protected Customer Portal */}
          <Route
            path="/portal"
            element={
              <ProtectedRoute>
                <RoleGuard allowCustomer={true}>
                  <Portal />
                </RoleGuard>
              </ProtectedRoute>
            }
          />

          {/* Root and Fallback Navigation */}
          <Route path="/" element={<RootRedirect />} />
          <Route path="*" element={<RootRedirect />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
