import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, FileText, ShieldCheck, LogOut } from 'lucide-react';
import ThemeToggle from '../ui/ThemeToggle';
import { useAuth } from '../../context/AuthContext';
import { APPROVALS_ROLES } from '../../config/roleAccess';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/quotations', label: 'Quotations', icon: FileText },
  { to: '/approvals', label: 'Approvals', icon: ShieldCheck, roles: APPROVALS_ROLES },
];

function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('') || '?';
}

export default function AppShell() {
  const { user, logout } = useAuth();
  const role = user?.role;

  const visibleItems = NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(role));

  return (
    <div className="df-app">
      <aside className="df-sidebar">
        <div className="df-sidebar-brand">
          <div className="df-sidebar-brand-mark">D</div>
          <div className="df-sidebar-brand-text">DealFlow360</div>
        </div>

        <nav className="df-sidebar-nav">
          {visibleItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `df-nav-item${isActive ? ' active' : ''}`}
            >
              <Icon size={17} strokeWidth={2} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <button type="button" className="df-nav-item" onClick={logout} style={{ border: 'none', background: 'none', cursor: 'pointer', width: '100%' }}>
          <LogOut size={17} strokeWidth={2} />
          <span>Log out</span>
        </button>

        <div className="df-sidebar-footer">
          <div className="df-avatar">{initials(user?.name)}</div>
          <div className="df-sidebar-user">
            <div className="df-sidebar-user-name">{user?.name || 'User'}</div>
            <div className="df-sidebar-user-role">{(role || 'customer').replace('_', ' ').toLowerCase()}</div>
          </div>
        </div>
      </aside>

      <div className="df-main">
        <Outlet />
      </div>
    </div>
  );
}
