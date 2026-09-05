import React from 'react';
import { Inbox } from 'lucide-react';

/**
 * PortalEmptyState
 * Generic empty/coming-soon state for portal sections that have no data
 * or no backend endpoint implemented yet.
 */
export default function PortalEmptyState({
  icon: Icon = Inbox,
  title = 'Nothing here yet',
  description = 'Data will appear here once it is available.',
  action = null,
}) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '3.5rem 2rem',
      textAlign: 'center',
      gap: '1rem',
    }}>
      <div style={{
        width: '52px',
        height: '52px',
        borderRadius: '12px',
        backgroundColor: 'var(--portal-chip-bg)',
        border: '1px solid var(--portal-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--portal-text-3)',
      }}>
        <Icon size={22} strokeWidth={1.5} />
      </div>
      <div>
        <p style={{
          fontSize: '0.9375rem',
          fontWeight: '600',
          color: 'var(--portal-text-2)',
          marginBottom: '0.375rem',
        }}>
          {title}
        </p>
        <p style={{
          fontSize: '0.8125rem',
          color: 'var(--portal-text-3)',
          maxWidth: '280px',
          lineHeight: '1.6',
        }}>
          {description}
        </p>
      </div>
      {action && (
        <div style={{ marginTop: '0.5rem' }}>
          {action}
        </div>
      )}
    </div>
  );
}
