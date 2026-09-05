import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import Dashboard from './pages/Dashboard';
import QuotationsList from './pages/quotations/QuotationsList';
import QuotationDetail from './pages/quotations/QuotationDetail';
import ApprovalsList from './pages/approvals/ApprovalsList';
import ApprovalDetail from './pages/approvals/ApprovalDetail';
import AppShell from './components/layout/AppShell';
import ProtectedRoute from './components/layout/ProtectedRoute';
import RoleRoute from './components/layout/RoleRoute';
import { APPROVALS_ROLES } from './config/roleAccess';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import OfflineBanner from './components/system/OfflineBanner';

function Protected({ children }) {
  return (
    <ProtectedRoute>
      <AuthProvider>{children}</AuthProvider>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <OfflineBanner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          <Route
            element={
              <Protected>
                <AppShell />
              </Protected>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/quotations" element={<QuotationsList />} />
            <Route path="/quotations/:id" element={<QuotationDetail />} />
            <Route
              path="/approvals"
              element={
                <RoleRoute roles={APPROVALS_ROLES}>
                  <ApprovalsList />
                </RoleRoute>
              }
            />
            <Route
              path="/approvals/:id"
              element={
                <RoleRoute roles={APPROVALS_ROLES}>
                  <ApprovalDetail />
                </RoleRoute>
              }
            />
          </Route>

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
