import React, { useState } from 'react';
import { FileText, RefreshCw, AlertCircle } from 'lucide-react';
import PortalSectionHeader from './PortalSectionHeader';
import PortalEmptyState from './PortalEmptyState';
import QuotationPreviewCard from './QuotationPreviewCard';

/**
 * PortalQuotations
 * 
 * Quotation list view.
 * 
 * Backend contract (when mounted):
 *   GET /api/portal/quotations           → array of quotation summaries
 *   GET /api/portal/quotations?status=X  → filtered by QuotationStatus enum
 * 
 * Response shape per item:
 *   { id, status, blendedRiskScore, createdAt, updatedAt,
 *     expiresAt, confirmationDeadline, lastActivityAt,
 *     lineCount, orderTotal }
 * 
 * Portal-visible statuses (from portal.service):
 *   APPROVED | NEGOTIATING | CONFIRMED | PENDING_APPROVAL
 * 
 * Currently: GET /api/portal/quotations is NOT mounted in server/src/index.js
 * This view shows the ready-to-connect UI with proper empty state.
 * 
 * To connect: import api from '../../services/api'; then call api.get('/portal/quotations')
 * inside a useEffect here. Wired to the same axios client with Bearer token.
 */

// Tabs match PORTAL_VISIBLE_STATUSES in portal.service.js
const STATUS_TABS = [
  { label: 'All',              value: undefined },
  { label: 'Approved',         value: 'APPROVED' },
  { label: 'Negotiating',      value: 'NEGOTIATING' },
  { label: 'Pending Approval', value: 'PENDING_APPROVAL' },
  { label: 'Confirmed',        value: 'CONFIRMED' },
];

function StatusTabs({ activeStatus, onChange }) {
  return (
    <div style={{
      display: 'flex',
      gap: '0.25rem',
      flexWrap: 'wrap',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      paddingBottom: '0',
      marginBottom: '1.25rem',
    }}>
      {STATUS_TABS.map(tab => {
        const isActive = tab.value === activeStatus;
        return (
          <button
            key={tab.label}
            onClick={() => onChange(tab.value)}
            style={{
              padding: '0.5rem 0.875rem',
              borderRadius: '0',
              border: 'none',
              borderBottom: isActive ? '2px solid #3b82f6' : '2px solid transparent',
              backgroundColor: 'transparent',
              color: isActive ? '#60a5fa' : '#475569',
              fontSize: '0.8125rem',
              fontWeight: isActive ? '600' : '500',
              cursor: 'pointer',
              transition: 'all 150ms ease',
              whiteSpace: 'nowrap',
              marginBottom: '-1px',
            }}
            onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = '#94a3b8'; }}
            onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = '#475569'; }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

export default function PortalQuotations() {
  const [activeStatus, setActiveStatus] = useState(undefined);

  // ── API integration point ──────────────────────────────────────────────────
  // When GET /api/portal/quotations is mounted in server/src/index.js:
  //
  //   const [quotations, setQuotations] = useState([]);
  //   const [loading, setLoading] = useState(true);
  //   const [error, setError] = useState(null);
  //
  //   useEffect(() => {
  //     setLoading(true);
  //     const params = activeStatus ? { status: activeStatus } : {};
  //     api.get('/portal/quotations', { params })
  //       .then(r => { setQuotations(r.data); setError(null); })
  //       .catch(err => setError(err.response?.data?.error || 'Failed to load quotations'))
  //       .finally(() => setLoading(false));
  //   }, [activeStatus]);
  //
  // ──────────────────────────────────────────────────────────────────────────

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
      <PortalSectionHeader
        title="Quotations"
        subtitle="Review and manage your open quotations and negotiation requests."
        action={
          <button
            onClick={() => {}}
            title="Refresh (connect API first)"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              padding: '0.375rem 0.75rem',
              borderRadius: '7px',
              border: '1px solid rgba(255,255,255,0.08)',
              backgroundColor: 'transparent',
              color: '#475569',
              fontSize: '0.8rem',
              fontWeight: '500',
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={13} />
            Refresh
          </button>
        }
      />

      <StatusTabs activeStatus={activeStatus} onChange={setActiveStatus} />

      {/* API not yet mounted notice */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.625rem',
        padding: '0.75rem 1rem',
        backgroundColor: 'rgba(59,130,246,0.07)',
        border: '1px solid rgba(59,130,246,0.15)',
        borderRadius: '9px',
        marginBottom: '1.25rem',
      }}>
        <AlertCircle size={14} color="#3b82f6" style={{ flexShrink: 0, marginTop: '1px' }} />
        <p style={{ fontSize: '0.7875rem', color: '#60a5fa', lineHeight: '1.5' }}>
          <strong>Backend route not yet mounted.</strong>{' '}
          To connect live data, mount <code style={{ fontFamily: 'monospace', fontSize: '0.75rem', backgroundColor: 'rgba(255,255,255,0.07)', padding: '1px 4px', borderRadius: '4px' }}>portalRoutes</code> in{' '}
          <code style={{ fontFamily: 'monospace', fontSize: '0.75rem', backgroundColor: 'rgba(255,255,255,0.07)', padding: '1px 4px', borderRadius: '4px' }}>server/src/index.js</code>{' '}
          then uncomment the <code style={{ fontFamily: 'monospace', fontSize: '0.75rem', backgroundColor: 'rgba(255,255,255,0.07)', padding: '1px 4px', borderRadius: '4px' }}>api.get('/portal/quotations')</code> call above.
        </p>
      </div>

      {/* 
        Live data renders here.
        Example: quotations.map(q => <QuotationPreviewCard key={q.id} quotation={q} onClick={() => {}} />)
      */}
      <PortalEmptyState
        icon={FileText}
        title="No quotations yet"
        description="Quotations shared with you by your sales representative will appear here."
      />
    </div>
  );
}
