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
 * Backend endpoint: GET /api/portal/quotations (mounted, wired via PortalQuotations.jsx)
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
        border: '1px solid var(--portal-border)',
        borderRadius: '10px',
        padding: '1rem 1.25rem',
        backgroundColor: 'var(--portal-surface)',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'border-color 180ms ease, background-color 180ms ease',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'var(--portal-accent-soft-border)';
        e.currentTarget.style.backgroundColor = 'var(--portal-accent-soft-bg)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--portal-border)';
        e.currentTarget.style.backgroundColor = 'var(--portal-surface)';
      }}
    >
      {/* Row 1: ID + Status */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{
            fontFamily: 'monospace',
            fontSize: '0.75rem',
            color: 'var(--portal-text-3)',
            backgroundColor: 'var(--portal-chip-bg)',
            border: '1px solid var(--portal-border)',
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
            color: 'var(--portal-text-1)',
            letterSpacing: '-0.025em',
          }}>
            {formattedTotal}
          </div>
          <div style={{
            fontSize: '0.75rem',
            color: 'var(--portal-text-3)',
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
              color: 'var(--portal-text-3)',
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
