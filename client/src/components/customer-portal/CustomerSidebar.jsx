import React from 'react';
import {
  LayoutDashboard,
  FileText,
  ShoppingBag,
  CreditCard,
  User,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

/**
 * CustomerSidebar
 *
 * UI/UX pass: this used to be its own bespoke inline-styled sidebar with a
 * flat "Zap" brand mark and plain-text footer, structurally unrelated to
 * the internal app's sidebar (AppShell.jsx). It now reuses the exact same
 * shared classes AppShell does — df-sidebar / df-sidebar-brand /
 * df-sidebar-nav / df-nav-item / df-sidebar-footer / df-avatar — so the
 * portal has the same glassmorphism sidebar, active-item gradient bar, and
 * gradient brand mark as the rest of the app, just scoped to the portal's
 * own (already theme-matched) --portal-* tokens for anything not covered
 * by the shared classes.
 *
 * Also: Orders and Billing were flagged `available: false` ("Soon") from
 * back when those panes were stubs — PortalOrders.jsx/PortalBilling.jsx are
 * fully built now (warehouse-splitting UI, hybrid invoices), so that was
 * stale and made two working features look disabled. Both are live now.
 *
 * Logout moved here (matching AppShell's pattern — a nav-item-style button
 * above a footer with avatar + name) instead of living in a topbar dropdown
 * menu, which also removes the last user of the "Profile" link that was
 * silently wired to a no-op (`onNavigate={() => {}}`) in the old
 * CustomerTopbar — Profile is already its own sidebar nav item below.
 */

const NAV_ITEMS = [
  { id: 'overview',    label: 'Overview',    icon: LayoutDashboard },
  { id: 'quotations',  label: 'Quotations',  icon: FileText },
  { id: 'orders',      label: 'Orders',      icon: ShoppingBag },
  { id: 'billing',     label: 'Billing',     icon: CreditCard },
  { id: 'profile',     label: 'Profile',     icon: User },
];

function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('') || '?';
}

export default function CustomerSidebar({ activeView, onNavigate }) {
  const { customer, logout } = useAuth();

  return (
    <aside className="df-sidebar">
      <div className="df-sidebar-brand">
        <div className="df-sidebar-brand-mark">D</div>
        <div>
          <div className="df-sidebar-brand-text">DealFlow360</div>
          <div style={{
            fontSize: '0.625rem',
            color: 'var(--portal-text-5)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            fontWeight: 600,
          }}>
            Customer Portal
          </div>
        </div>
      </div>

      <nav className="df-sidebar-nav">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => onNavigate(id)}
            className={`df-nav-item${activeView === id ? ' active' : ''}`}
            style={{ border: 'none', background: 'none', cursor: 'pointer', width: '100%', textAlign: 'left' }}
          >
            <Icon size={17} strokeWidth={2} />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      <button
        type="button"
        className="df-nav-item"
        onClick={logout}
        style={{ border: 'none', background: 'none', cursor: 'pointer', width: '100%' }}
      >
        <LogOut size={17} strokeWidth={2} />
        <span>Log out</span>
      </button>

      <div className="df-sidebar-footer">
        <div className="df-avatar">{initials(customer?.name)}</div>
        <div className="df-sidebar-user">
          <div className="df-sidebar-user-name">{customer?.name || 'Customer'}</div>
          <div className="df-sidebar-user-role">Customer</div>
        </div>
      </div>
    </aside>
  );
}
