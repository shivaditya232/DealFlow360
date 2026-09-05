import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import OfflineBanner from './components/system/OfflineBanner';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import Dashboard from './pages/Dashboard';
import Portal from './pages/Portal';
import QuotationsList from './pages/quotations/QuotationsList';
import QuotationDetail from './pages/quotations/QuotationDetail';
import ApprovalsList from './pages/approvals/ApprovalsList';
import ApprovalDetail from './pages/approvals/ApprovalDetail';
import AppShell from './components/layout/AppShell';
import ProtectedRoute from './routes/ProtectedRoute';
import RoleGuard from './routes/RoleGuard';

// Internal roles that can reach the rep workspace (Dashboard/Quotations);
// /approvals narrows further to Manager/Finance/Admin via a nested RoleGuard.
const INTERNAL_ROLES = ['SALES_REP', 'MANAGER', 'FINANCE', 'ADMIN'];
const APPROVAL_ROLES = ['MANAGER', 'FINANCE', 'ADMIN'];

/**
 * Root Index Dispatcher — sends an authenticated user to their landing
 * (internal workspace vs customer portal) and anyone else to /login.
 */
function RootRedirect() {
  const { isAuthenticated, landing, isLoading } = useAuth();

  if (isLoading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Navigate to={landing === 'PORTAL' ? '/portal' : '/dashboard'} replace />;
}

export default function App() {
  return (
    <ThemeProvider>
      <OfflineBanner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            {/* Internal rep workspace — Dashboard, Quotations, Approvals,
                all inside AppShell's sidebar layout */}
            <Route
              element={
                <ProtectedRoute>
                  <RoleGuard allowedRoles={INTERNAL_ROLES}>
                    <AppShell />
                  </RoleGuard>
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/quotations" element={<QuotationsList />} />
              <Route path="/quotations/:id" element={<QuotationDetail />} />
              <Route
                path="/approvals"
                element={
                  <RoleGuard allowedRoles={APPROVAL_ROLES}>
                    <ApprovalsList />
                  </RoleGuard>
                }
              />
              <Route
                path="/approvals/:id"
                element={
                  <RoleGuard allowedRoles={APPROVAL_ROLES}>
                    <ApprovalDetail />
                  </RoleGuard>
                }
              />
            </Route>

            {/* Customer Portal — separate restricted view */}
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
