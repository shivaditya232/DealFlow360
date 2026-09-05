import React from 'react';
import { Menu, X } from 'lucide-react';
import ThemeToggle from '../ui/ThemeToggle';

/**
 * CustomerTopbar
 *
 * Simplified to match the internal app's TopBar.jsx pattern:
 * left = (mobile-only) sidebar toggle + page title, right = theme toggle.
 * Profile/logout now live in the sidebar footer (CustomerSidebar), so the
 * old avatar dropdown and placeholder notification bell have been removed.
 */
export default function CustomerTopbar({ title, onToggleSidebar, sidebarOpen, isMobile }) {
  return (
    <div className="df-topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {isMobile && (
          <button
            className="df-icon-btn"
            onClick={onToggleSidebar}
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        )}
        <div className="df-topbar-title">{title}</div>
      </div>
      <div className="df-topbar-actions">
        <ThemeToggle />
      </div>
    </div>
  );
}
