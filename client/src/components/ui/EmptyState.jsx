import React from 'react';

export default function EmptyState({ icon, title, description, action }) {
  return (
    <div className="df-empty-state">
      {icon && <div className="df-empty-state-icon">{icon}</div>}
      <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 14 }}>{title}</div>
      {description && <div className="df-text-sm">{description}</div>}
      {action}
    </div>
  );
}
