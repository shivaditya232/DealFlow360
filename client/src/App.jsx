import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import Dashboard from './pages/Dashboard';
import Portal from './pages/Portal';
import QuotationsList from './pages/quotations/QuotationsList';
import QuotationDetail from './pages/quotations/QuotationDetail';
import ApprovalsList from './pages/approvals/ApprovalsList';
import ApprovalDetail from './pages/approvals/ApprovalDetail';
import ProtectedRoute from './routes/ProtectedRoute';
import RoleGuard from './routes/RoleGuard';
import AppShell from './components/layout/AppShell';

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
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            {/* Protected Internal Workspace Layout (AppShell) */}
            <Route
              element={
                <ProtectedRoute>
                  <AppShell />
                </ProtectedRoute>
              }
            >
              <Route
                path="/dashboard"
                element={
                  <RoleGuard allowedRoles={['SALES_REP', 'MANAGER', 'FINANCE', 'ADMIN']}>
                    <Dashboard />
                  </RoleGuard>
                }
              />
              <Route
                path="/quotations"
                element={
                  <RoleGuard allowedRoles={['SALES_REP', 'MANAGER', 'FINANCE', 'ADMIN']}>
                    <QuotationsList />
                  </RoleGuard>
                }
              />
              <Route
                path="/quotations/:id"
                element={
                  <RoleGuard allowedRoles={['SALES_REP', 'MANAGER', 'FINANCE', 'ADMIN']}>
                    <QuotationDetail />
                  </RoleGuard>
                }
              />
              <Route
                path="/approvals"
                element={
                  <RoleGuard allowedRoles={['MANAGER', 'FINANCE', 'ADMIN']}>
                    <ApprovalsList />
                  </RoleGuard>
                }
              />
              <Route
                path="/approvals/:id"
                element={
                  <RoleGuard allowedRoles={['MANAGER', 'FINANCE', 'ADMIN']}>
                    <ApprovalDetail />
                  </RoleGuard>
                }
              />
            </Route>

            {/* Protected External Customer Portal */}
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
    </ThemeProvider>
  );
}

