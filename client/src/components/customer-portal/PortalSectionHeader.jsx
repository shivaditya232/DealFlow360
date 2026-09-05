import React from 'react';

/**
 * PortalSectionHeader
 * Consistent section heading with optional badge and action slot.
 */
export default function PortalSectionHeader({ title, subtitle, badge, action }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: '1rem',
      marginBottom: '1.25rem',
    }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <h2 style={{
            fontSize: '0.9375rem',
            fontWeight: '700',
            color: 'var(--portal-text-1)',
            letterSpacing: '-0.01em',
          }}>
            {title}
          </h2>
          {badge !== undefined && badge !== null && (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: '20px',
              height: '20px',
              padding: '0 6px',
              borderRadius: '9999px',
              backgroundColor: 'var(--portal-accent-soft-bg-strong)',
              color: 'var(--portal-accent-strong)',
              fontSize: '0.6875rem',
              fontWeight: '700',
              letterSpacing: '0.02em',
            }}>
              {badge}
            </span>
          )}
        </div>
        {subtitle && (
          <p style={{
            marginTop: '0.25rem',
            fontSize: '0.8125rem',
            color: 'var(--portal-text-3)',
            lineHeight: '1.5',
          }}>
            {subtitle}
          </p>
        )}
      </div>
      {action && (
        <div style={{ flexShrink: 0 }}>
          {action}
        </div>
      )}
    </div>
  );
}
