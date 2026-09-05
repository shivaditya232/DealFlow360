import React, { useEffect, useState, useCallback } from 'react';
import { FileText, RefreshCw } from 'lucide-react';
import portalService from '../../services/portal.service';
import PortalSectionHeader from './PortalSectionHeader';
import PortalEmptyState from './PortalEmptyState';
import QuotationPreviewCard from './QuotationPreviewCard';

/**
 * PortalQuotations
 *
 * Quotation list view.
 *
 * Backend: GET /api/portal/quotations (portal.routes.js — mounted).
 * Response shape per item:
 *   { id, status, blendedRiskScore, createdAt, updatedAt,
 *     expiresAt, confirmationDeadline, lastActivityAt,
 *     lineCount, orderTotal }
 *
 * Portal-visible statuses (from portal.service.js on the server):
 *   APPROVED | NEGOTIATING | CONFIRMED | PENDING_APPROVAL
 */

// Tabs match PORTAL_VISIBLE_STATUSES in server/src/services/portal.service.js
const STATUS_TABS = [
  { label: 'All',              value: undefined },
  { label: 'Approved',         value: 'APPROVED' },
  { label: 'Negotiating',      value: 'NEGOTIATING' },
  { label: 'Pending Approval', value: 'PENDING_APPROVAL' },
  { label: 'Confirmed',        value: 'CONFIRMED' },
];

function StatusTabs({ activeStatus, onChange }) {
  return (
    <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap', borderBottom: '1px solid var(--portal-border)', paddingBottom: '0', marginBottom: '1.25rem' }}>
      {STATUS_TABS.map(tab => {
        const isActive = tab.value === activeStatus;
        return (
          <button
            key={tab.label}
            onClick={() => onChange(tab.value)}
            style={{
              padding: '0.5rem 0.875rem', borderRadius: '0', border: 'none',
              borderBottom: isActive ? '2px solid var(--portal-accent)' : '2px solid transparent',
              backgroundColor: 'transparent',
              color: isActive ? 'var(--portal-accent-strong)' : 'var(--portal-text-3)',
              fontSize: '0.8125rem', fontWeight: isActive ? '600' : '500',
              cursor: 'pointer', transition: 'all 150ms ease', whiteSpace: 'nowrap', marginBottom: '-1px',
            }}
            onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = 'var(--portal-text-1b)'; }}
            onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = 'var(--portal-text-3)'; }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

export default function PortalQuotations({ onOpenQuotation }) {
  const [activeStatus, setActiveStatus] = useState(undefined);
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    portalService.listQuotations(activeStatus)
      .then((data) => {
        setQuotations(Array.isArray(data) ? data : []);
        setError(null);
      })
      .catch((err) => {
        setError(err.response?.data?.error || err.friendlyMessage || 'Failed to load quotations.');
      })
      .finally(() => setLoading(false));
  }, [activeStatus]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
      <PortalSectionHeader
        title="Quotations"
        subtitle="Review and manage your open quotations and negotiation requests."
        action={
          <button
            onClick={load}
            title="Refresh"
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              padding: '0.4rem 0.75rem',
              borderRadius: '7px',
              border: '1px solid var(--portal-border-strong)',
              backgroundColor: 'transparent',
              color: 'var(--portal-text-2)',
              fontSize: '0.75rem',
              fontWeight: '600',
              cursor: loading ? 'default' : 'pointer',
              opacity: loading ? 0.6 : 1,
            }}
          >
            <RefreshCw size={13} style={loading ? { animation: 'spin 1s linear infinite' } : undefined} /> Refresh
          </button>
        }
      />
      <StatusTabs activeStatus={activeStatus} onChange={setActiveStatus} />

      {error && (
        <div style={{
          padding: '0.875rem 1rem',
          backgroundColor: 'rgba(239,68,68,0.08)',
          border: '1px solid rgba(239,68,68,0.22)',
          borderRadius: '9px',
          color: 'var(--color-danger-500)',
          fontSize: '0.8125rem',
          marginBottom: '1.25rem',
        }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{
              height: '84px',
              borderRadius: '10px',
              border: '1px solid var(--portal-border)',
              backgroundColor: 'var(--portal-chip-bg)',
              animation: 'pulse 1.5s ease-in-out infinite',
            }} />
          ))}
        </div>
      ) : quotations.length === 0 ? (
        <PortalEmptyState
          icon={FileText}
          title="No quotations yet"
          description="Quotations shared with you by your sales representative will appear here."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {quotations.map(q => (
            <QuotationPreviewCard key={q.id} quotation={q} onClick={() => onOpenQuotation?.(q.id)} />
          ))}
        </div>
      )}
    </div>
  );
}
