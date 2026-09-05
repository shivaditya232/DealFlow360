import React from 'react';
import {
  LayoutDashboard,
  FileText,
  ShoppingBag,
  CreditCard,
  User,
  Zap,
  ChevronRight,
} from 'lucide-react';

/**
 * CustomerSidebar
 *
 * Navigation items:
 *   Overview   → /portal (active view switch only, no separate route needed at this stage)
 *   Quotations → backend: GET /api/portal/quotations (mounted, wired)
 *   Orders     → backend: no endpoint yet
 *   Billing    → backend: no endpoint yet
 *   Profile    → backend: GET /api/portal/profile (mounted, wired)
 *
 * Navigation is handled via `activeView` prop + `onNavigate` callback
 * so the portal can swap content panes without extra routes.
 */

const NAV_ITEMS = [
  { id: 'overview',    label: 'Overview',    icon: LayoutDashboard, available: true  },
  { id: 'quotations',  label: 'Quotations',  icon: FileText,        available: true  },
  { id: 'orders',      label: 'Orders',      icon: ShoppingBag,     available: false },
  { id: 'billing',     label: 'Billing',     icon: CreditCard,      available: false },
  { id: 'profile',     label: 'Profile',     icon: User,            available: true  },
];

function NavItem({ item, isActive, onClick }) {
  const { label, icon: Icon, available } = item;

  return (
    <button
      onClick={() => onClick(item.id)}
      title={!available ? 'Coming soon' : undefined}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.625rem',
        width: '100%',
        padding: '0.5625rem 0.875rem',
        borderRadius: '8px',
        border: 'none',
        cursor: available ? 'pointer' : 'default',
        textAlign: 'left',
        transition: 'all 150ms ease',
        backgroundColor: isActive ? 'var(--portal-accent-soft-bg-strong)' : 'transparent',
        color: isActive ? 'var(--portal-accent-strong)' : available ? 'var(--portal-text-2)' : 'var(--portal-text-5)',
      }}
      onMouseEnter={e => {
        if (!isActive && available) {
          e.currentTarget.style.backgroundColor = 'var(--portal-hover)';
          e.currentTarget.style.color = 'var(--portal-text-1b)';
        }
      }}
      onMouseLeave={e => {
        if (!isActive) {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.color = available ? 'var(--portal-text-2)' : 'var(--portal-text-5)';
        }
      }}
    >
      <Icon size={16} strokeWidth={isActive ? 2.5 : 1.75} />
      <span style={{
        fontSize: '0.875rem',
        fontWeight: isActive ? '600' : '500',
        flex: 1,
        letterSpacing: '0.005em',
      }}>
        {label}
      </span>
      {isActive && <ChevronRight size={13} style={{ opacity: 0.5 }} />}
      {!available && (
        <span style={{
          fontSize: '0.625rem',
          fontWeight: '600',
          color: 'var(--portal-text-5)',
          backgroundColor: 'var(--portal-chip-bg)',
          border: '1px solid var(--portal-border)',
          padding: '1px 5px',
          borderRadius: '4px',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
        }}>
          Soon
        </span>
      )}
    </button>
  );
}

export default function CustomerSidebar({ activeView, onNavigate, collapsed = false }) {
  return (
    <aside style={{
      width: collapsed ? '0' : '220px',
      minWidth: collapsed ? '0' : '220px',
      backgroundColor: 'var(--portal-surface-alt)',
      borderRight: '1px solid var(--portal-border)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      transition: 'width 250ms ease, min-width 250ms ease',
    }}>
      {/* Brand Header */}
      <div style={{
        padding: '1.375rem 1.125rem 1rem',
        borderBottom: '1px solid var(--portal-border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '7px',
            background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Zap size={14} color="white" strokeWidth={2.5} />
          </div>
          <div>
            <div style={{
              fontSize: '0.8rem',
              fontWeight: '800',
              color: 'var(--portal-text-1)',
              letterSpacing: '-0.01em',
            }}>
              DealFlow<span style={{ color: 'var(--portal-accent)' }}>360</span>
            </div>
            <div style={{
              fontSize: '0.6rem',
              color: 'var(--portal-text-5)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              fontWeight: '600',
            }}>
              Customer Portal
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{
        flex: 1,
        padding: '0.875rem 0.625rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.125rem',
        overflowY: 'auto',
      }}>
        <div style={{
          fontSize: '0.625rem',
          fontWeight: '700',
          color: 'var(--portal-text-5)',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          padding: '0 0.875rem',
          marginBottom: '0.375rem',
        }}>
          Workspace
        </div>

        {NAV_ITEMS.map(item => (
          <NavItem
            key={item.id}
            item={item}
            isActive={activeView === item.id}
            onClick={onNavigate}
          />
        ))}
      </nav>

      {/* Footer */}
      <div style={{
        padding: '0.875rem 1rem',
        borderTop: '1px solid var(--portal-border)',
      }}>
        <div style={{
          fontSize: '0.6875rem',
          color: 'var(--portal-text-5)',
          textAlign: 'center',
        }}>
          DealFlow360 · Customer Portal
        </div>
      </div>
    </aside>
  );
}
