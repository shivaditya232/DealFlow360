import React, { useState, useEffect } from 'react';
import CustomerSidebar from './CustomerSidebar';
import CustomerTopbar from './CustomerTopbar';
import PortalOverview from './PortalOverview';
import PortalQuotations from './PortalQuotations';
import PortalOrders from './PortalOrders';
import PortalBilling from './PortalBilling';
import PortalProfileView from './PortalProfileView';

/**
 * CustomerPortalShell
 *
 * Root layout for the Customer Portal.
 *
 * Authentication:
 *   - /portal is protected by ProtectedRoute + RoleGuard (allowCustomer=true)
 *   - accountType === 'CUSTOMER' is required (not role === 'CUSTOMER')
 *   - JWT auto-attached to all api.js calls via request interceptor
 *   - Logout clears JWT from storage (both localStorage + sessionStorage)
 *   - 401 responses auto-clear session and redirect to /login
 *
 * View routing:
 *   Internal SPA pane switching — no extra React Router routes.
 *   The portal is one protected route: /portal
 *   Content panes are switched via `activeView` state.
 *
 * Theming:
 *   The `df-portal` class scopes the CSS custom properties defined in
 *   styles/portal.css. Those tokens flip automatically with the app-wide
 *   [data-theme] attribute that ThemeContext sets on <html>, so this view
 *   now supports both light and dark mode like the rest of the app.
 *
 * Responsive:
 *   - Desktop: sidebar always visible
 *   - Tablet / mobile: sidebar collapses to a drawer via hamburger menu
 */

const VIEW_TITLES = {
  overview:   'Overview',
  quotations: 'Quotations',
  orders:     'Orders',
  billing:    'Billing',
  profile:    'My Profile',
};

function useMediaQuery(query) {
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia(query);
    const handler = (e) => setMatches(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

export default function CustomerPortalShell() {
  const [activeView, setActiveView] = useState('overview');
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);

  // Collapse sidebar on mobile by default
  useEffect(() => {
    setSidebarOpen(!isMobile);
  }, [isMobile]);

  const handleNavigate = (view) => {
    setActiveView(view);
    if (isMobile) setSidebarOpen(false); // auto-close on mobile after navigation
  };

  const renderView = () => {
    switch (activeView) {
      case 'overview':   return <PortalOverview onNavigate={handleNavigate} />;
      case 'quotations': return <PortalQuotations />;
      case 'orders':     return <PortalOrders />;
      case 'billing':    return <PortalBilling />;
      case 'profile':    return <PortalProfileView />;
      default:           return <PortalOverview onNavigate={handleNavigate} />;
    }
  };

  return (
    <div
      id="customer-portal-shell"
      className="df-portal"
      style={{
        display: 'flex',
        height: '100vh',
        width: '100vw',
        backgroundColor: 'var(--portal-bg)',
        color: 'var(--portal-text-1)',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Mobile sidebar backdrop */}
      {isMobile && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'var(--portal-backdrop)',
            zIndex: 40,
            backdropFilter: 'blur(2px)',
          }}
        />
      )}

      {/* Sidebar — slides in on mobile, always visible on desktop */}
      <div style={{
        position: isMobile ? 'fixed' : 'relative',
        top: 0,
        left: 0,
        bottom: 0,
        zIndex: isMobile ? 50 : 'auto',
        transform: (isMobile && !sidebarOpen) ? 'translateX(-100%)' : 'translateX(0)',
        transition: 'transform 250ms ease',
        display: 'flex',
        flexShrink: 0,
      }}>
        <CustomerSidebar
          activeView={activeView}
          onNavigate={handleNavigate}
          collapsed={false}
        />
      </div>

      {/* Main content area */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        minWidth: 0,
      }}>
        {/* Topbar */}
        <CustomerTopbar
          title={VIEW_TITLES[activeView] || 'Customer Portal'}
          onToggleSidebar={() => setSidebarOpen(o => !o)}
          sidebarOpen={sidebarOpen}
        />

        {/* Scrollable content pane */}
        <main
          id="portal-main-content"
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1.75rem',
          }}
        >
          {renderView()}
        </main>
      </div>
    </div>
  );
}
