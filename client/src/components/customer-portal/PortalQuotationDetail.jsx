import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, Calendar, MessageSquare, ChevronRight } from 'lucide-react';
import portalService from '../../services/portal.service';
import useQuotationSocket from '../../hooks/useQuotationSocket';
import QuotationStatusBadge from './QuotationStatusBadge';

/**
 * PortalQuotationDetail
 *
 * Customer-facing single-quotation view. Backed by the already-mounted
 * portal routes:
 *   GET  /api/portal/quotations/:id                → full line detail + currentProposal
 *   POST /api/portal/quotations/:id/accept          → accept as-is (only when no proposal pending)
 *   POST /api/portal/quotations/:id/proposals       → create/overwrite the customer's own proposal
 *   POST /api/portal/proposals/:proposalId/accept   → accept the rep's counter-offer
 *
 * A quotation is only negotiable (accept / propose) while status is
 * APPROVED or NEGOTIATING — PENDING_APPROVAL and CONFIRMED render read-only.
 */
export default function PortalQuotationDetail({ quotationId, onBack }) {
  const navigate = useNavigate();
  const [quotation, setQuotation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    portalService.getQuotation(quotationId)
      .then((data) => {
        setQuotation(data);
        setError(null);
      })
      .catch((err) => {
        setError(err.response?.data?.error || err.friendlyMessage || 'Failed to load this quotation.');
      })
      .finally(() => setLoading(false));
  }, [quotationId]);

  useEffect(() => { load(); }, [load]);

  // Live updates: when the rep responds to a proposal (or anyone else acts
  // on this quotation) while the customer has it open, refetch instead of
  // making them hit Refresh — same room/event the internal negotiation
  // thread already listens on (server/src/sockets/index.js broadcasts to
  // `quotation:${quotationId}` from portal.service.js / approval.service.js).
  useQuotationSocket(quotationId, () => load());

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{ height: '32px', width: '220px', borderRadius: '6px', backgroundColor: 'var(--portal-chip-bg)' }} />
        {[1, 2, 3].map(i => (
          <div key={i} style={{ height: '64px', borderRadius: '10px', backgroundColor: 'var(--portal-chip-bg)' }} />
        ))}
      </div>
    );
  }

  if (error || !quotation) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <BackButton onBack={onBack} />
        <div style={{
          padding: '0.875rem 1rem',
          backgroundColor: 'rgba(239,68,68,0.08)',
          border: '1px solid rgba(239,68,68,0.22)',
          borderRadius: '9px',
          color: 'var(--color-danger-500)',
          fontSize: '0.8125rem',
        }}>
          {error || 'Quotation not found.'}
        </div>
      </div>
    );
  }

  const { status, lines, orderTotal, currentProposal, negotiationThread, expiresAt, confirmationDeadline, lastActivityAt } = quotation;
  const negotiable = status === 'APPROVED' || status === 'NEGOTIATING';
  const shortId = quotation.id?.slice(-8)?.toUpperCase();
  const formatDate = (iso) => iso ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : null;
  const formatMoney = (n) => typeof n === 'number' ? `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '760px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <BackButton onBack={onBack} />
          <div>
            <h2 style={{ fontSize: '1.0625rem', fontWeight: '700', color: 'var(--portal-text-1)', letterSpacing: '-0.01em' }}>
              Quotation #{shortId}
            </h2>
            <p style={{ fontSize: '0.75rem', color: 'var(--portal-text-4)', marginTop: '0.15rem' }}>
              Last updated {formatDate(lastActivityAt)}
            </p>
          </div>
        </div>
        <QuotationStatusBadge status={status} />
      </div>

      {actionError && (
        <div style={{
          padding: '0.75rem 1rem',
          backgroundColor: 'rgba(239,68,68,0.08)',
          border: '1px solid rgba(239,68,68,0.22)',
          borderRadius: '9px',
          color: 'var(--color-danger-500)',
          fontSize: '0.8125rem',
        }}>
          {actionError}
        </div>
      )}

      {/* Line items */}
      <div style={{
        backgroundColor: 'var(--portal-surface)',
        border: '1px solid var(--portal-border)',
        borderRadius: '12px',
        overflow: 'hidden',
      }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--portal-border)' }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: '700', color: 'var(--portal-text-1)' }}>Line Items</h3>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {(lines || []).map((line, idx) => (
            <div key={line.id || idx} style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              padding: '0.875rem 1.25rem',
              borderBottom: idx === lines.length - 1 ? 'none' : '1px solid var(--portal-border)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '8px',
                  backgroundColor: 'var(--portal-chip-bg)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', color: 'var(--portal-text-4)', flexShrink: 0,
                }}>
                  <Package size={14} strokeWidth={1.75} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '0.8125rem', fontWeight: '600', color: 'var(--portal-text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {line.product?.name || 'Item'}
                    {line.variant ? ` — ${line.variant.attributeName}: ${line.variant.attributeValue}` : ''}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--portal-text-4)', marginTop: '0.1rem' }}>
                    {line.quantity} × {formatMoney(Number(line.unitPrice))} {Number(line.discountPercent) > 0 ? `· ${line.discountPercent}% off` : ''}
                  </div>
                </div>
              </div>
              <div style={{ fontSize: '0.875rem', fontWeight: '700', color: 'var(--portal-text-1)', flexShrink: 0 }}>
                {formatMoney(line.lineTotal)}
              </div>
            </div>
          ))}
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0.875rem 1.25rem', backgroundColor: 'var(--portal-surface-alt)',
        }}>
          <span style={{ fontSize: '0.8125rem', color: 'var(--portal-text-2)', fontWeight: '600' }}>Total</span>
          <span style={{ fontSize: '1.125rem', color: 'var(--portal-text-1)', fontWeight: '700' }}>{formatMoney(orderTotal)}</span>
        </div>
      </div>

      {/* Dates */}
      {(expiresAt || confirmationDeadline) && (
        <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
          {expiresAt && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: 'var(--color-warning-500)' }}>
              <Calendar size={13} /> Expires {formatDate(expiresAt)}
            </span>
          )}
          {confirmationDeadline && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: 'var(--color-danger-500)' }}>
              <Calendar size={13} /> Confirm by {formatDate(confirmationDeadline)}
            </span>
          )}
        </div>
      )}

      {/* Negotiation summary — opens the dedicated chat page */}
      <div
        onClick={() => navigate(`/portal/quotations/${quotationId}/negotiation`)}
        style={{
          backgroundColor: 'var(--portal-surface)',
          border: '1px solid var(--portal-border)',
          borderRadius: '12px',
          padding: '1.125rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          cursor: 'pointer',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
          <MessageSquare size={18} color="var(--portal-text-3)" style={{ flexShrink: 0 }} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '0.875rem', fontWeight: '700', color: 'var(--portal-text-1)' }}>Negotiation Chat</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--portal-text-4)', marginTop: '0.1rem' }}>
              {!negotiationThread || negotiationThread.length === 0
                ? 'No messages yet'
                : `${negotiationThread.length} message${negotiationThread.length === 1 ? '' : 's'} · last from ${negotiationThread[negotiationThread.length - 1].fromName}`}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
          {currentProposal?.proposedByType === 'REP' && (
            <span style={{
              fontSize: '0.6875rem', fontWeight: '700', padding: '0.2rem 0.5rem', borderRadius: '999px',
              backgroundColor: 'var(--portal-accent-soft-bg)', color: 'var(--portal-accent-strong)',
            }}>
              Reply needed
            </span>
          )}
          <ChevronRight size={16} color="var(--portal-text-4)" />
        </div>
      </div>
    </div>
  );
}

function BackButton({ onBack }) {
  return (
    <button
      onClick={onBack}
      aria-label="Back to quotations"
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: '32px', height: '32px', borderRadius: '8px',
        border: '1px solid var(--portal-border-strong)', backgroundColor: 'transparent',
        color: 'var(--portal-text-2)', cursor: 'pointer', flexShrink: 0,
      }}
    >
      <ArrowLeft size={16} />
    </button>
  );
}

