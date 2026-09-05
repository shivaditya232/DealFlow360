import React from 'react';
import { Calendar, Package } from 'lucide-react';
import QuotationStatusBadge from './QuotationStatusBadge';

/**
 * QuotationPreviewCard
 * 
 * Props reflect the shape returned by the portal.service listPortalQuotations:
 *   id, status, blendedRiskScore, createdAt, updatedAt,
 *   expiresAt, confirmationDeadline, lastActivityAt,
 *   lineCount, orderTotal
 * 
 * Backend endpoint: GET /api/portal/quotations (NOT yet mounted in index.js)
 * This component is API-ready but receives no live data until the route is mounted.
 */
export default function QuotationPreviewCard({ quotation, onClick }) {
  const {
    id,
    status,
    lineCount,
    orderTotal,
    expiresAt,
    lastActivityAt,
    confirmationDeadline,
  } = quotation;

  const formattedTotal = typeof orderTotal === 'number'
    ? `$${orderTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : '—';

  const formatDate = (iso) => {
    if (!iso) return null;
    try {
      return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return null;
    }
  };

  const shortId = id?.slice(-8)?.toUpperCase() ?? '—';

  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        background: 'none',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: '10px',
        padding: '1rem 1.25rem',
        backgroundColor: '#0d1324',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'border-color 180ms ease, background-color 180ms ease',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'rgba(59,130,246,0.3)';
        e.currentTarget.style.backgroundColor = 'rgba(59,130,246,0.04)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)';
        e.currentTarget.style.backgroundColor = '#0d1324';
      }}
    >
      {/* Row 1: ID + Status */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{
            fontFamily: 'monospace',
            fontSize: '0.75rem',
            color: '#475569',
            backgroundColor: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.06)',
            padding: '2px 6px',
            borderRadius: '5px',
          }}>
            #{shortId}
          </span>
        </div>
        <QuotationStatusBadge status={status} />
      </div>

      {/* Row 2: Order total + line count */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <div style={{
            fontSize: '1.25rem',
            fontWeight: '700',
            color: '#f1f5f9',
            letterSpacing: '-0.025em',
          }}>
            {formattedTotal}
          </div>
          <div style={{
            fontSize: '0.75rem',
            color: '#475569',
            display: 'flex',
            alignItems: 'center',
            gap: '0.3rem',
            marginTop: '0.2rem',
          }}>
            <Package size={11} />
            {lineCount != null ? `${lineCount} line item${lineCount !== 1 ? 's' : ''}` : '— items'}
          </div>
        </div>

        {/* Dates */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.2rem' }}>
          {expiresAt && (
            <div style={{
              fontSize: '0.7375rem',
              color: '#f59e0b',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
            }}>
              <Calendar size={10} />
              Expires {formatDate(expiresAt)}
            </div>
          )}
          {!expiresAt && lastActivityAt && (
            <div style={{
              fontSize: '0.7375rem',
              color: '#475569',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
            }}>
              <Calendar size={10} />
              {formatDate(lastActivityAt)}
            </div>
          )}
          {confirmationDeadline && (
            <div style={{
              fontSize: '0.7375rem',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
            }}>
              Confirm by {formatDate(confirmationDeadline)}
            </div>
          )}
        </div>
      </div>
    </button>
  );
}
