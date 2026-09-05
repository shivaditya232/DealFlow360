import React from 'react';
import ThemeToggle from '../ui/ThemeToggle';

export default function TopBar({ title, subtitle, actions }) {
  return (
    <div className="df-topbar">
      <div>
        <div className="df-topbar-title">{title}</div>
        {subtitle && <div className="df-topbar-subtitle">{subtitle}</div>}
      </div>
      <div className="df-topbar-actions">
        {actions}
        <ThemeToggle />
      </div>
    </div>
  );
}
