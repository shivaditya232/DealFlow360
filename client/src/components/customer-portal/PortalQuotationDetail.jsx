import React, { useEffect, useState, useCallback } from 'react';
import { ArrowLeft, Package, Calendar, MessageSquare, CheckCircle, Send, X } from 'lucide-react';
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
  const [quotation, setQuotation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [actionPending, setActionPending] = useState(false);
  const [showCounterForm, setShowCounterForm] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [message, setMessage] = useState('');
  const [discountPercent, setDiscountPercent] = useState('');
  const [rejectMessage, setRejectMessage] = useState('');

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

  const runAction = (fn) => {
    setActionError(null);
    setActionPending(true);
    fn()
      .then(() => {
        setShowCounterForm(false);
        setShowRejectForm(false);
        setMessage('');
        setDiscountPercent('');
        setRejectMessage('');
        load();
      })
      .catch((err) => {
        setActionError(err.response?.data?.error || err.friendlyMessage || 'That action could not be completed.');
      })
      .finally(() => setActionPending(false));
  };

  const handleAccept = () => runAction(() => portalService.acceptQuotation(quotationId));
  const handleAcceptProposal = (proposalId) => runAction(() => portalService.customerAcceptProposal(proposalId));
  const handleRejectProposal = (proposalId) => runAction(() => portalService.customerRejectProposal(proposalId, rejectMessage.trim()));
  const handleSendProposal = (e) => {
    e.preventDefault();
    const trimmedMessage = message.trim();
    const parsedDiscount = discountPercent !== '' ? Number(discountPercent) : undefined;
    if (!trimmedMessage && parsedDiscount === undefined) {
      setActionError('Add a message or a requested discount before sending.');
      return;
    }
    runAction(() => portalService.createProposal(quotationId, {
      proposedChanges: parsedDiscount !== undefined ? { discountPercent: parsedDiscount } : null,
      message: trimmedMessage || null,
    }));
  };

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

  const { status, lines, orderTotal, currentProposal, expiresAt, confirmationDeadline, lastActivityAt } = quotation;
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

      {/* Negotiation / actions */}
      <div style={{
        backgroundColor: 'var(--portal-surface)',
        border: '1px solid var(--portal-border)',
        borderRadius: '12px',
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
      }}>
        <h3 style={{ fontSize: '0.875rem', fontWeight: '700', color: 'var(--portal-text-1)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <MessageSquare size={15} /> Negotiation
        </h3>

        {status === 'CONFIRMED' && (
          <EmptyNotice icon={CheckCircle} color="var(--color-success-500)" text="This quotation is confirmed. No further changes can be proposed." />
        )}
        {status === 'PENDING_APPROVAL' && (
          <EmptyNotice icon={MessageSquare} color="var(--color-warning-500)" text="This quotation is awaiting internal approval before it can be negotiated." />
        )}

        {currentProposal && (
          <div style={{
            padding: '0.875rem 1rem',
            borderRadius: '9px',
            backgroundColor: 'var(--portal-accent-soft-bg)',
            border: '1px solid var(--portal-accent-soft-border)',
          }}>
            <p style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--portal-accent-strong)', marginBottom: '0.35rem' }}>
              {currentProposal.proposedByType === 'REP' ? 'Your rep sent a counter-offer' : 'Waiting for your rep to respond'}
            </p>
            {currentProposal.proposedChanges?.discountPercent != null && (
              <p style={{ fontSize: '0.8125rem', color: 'var(--portal-text-1b)' }}>
                Requested discount: {currentProposal.proposedChanges.discountPercent}%
              </p>
            )}
            {currentProposal.proposedChanges?.quantity != null && (
              <p style={{ fontSize: '0.8125rem', color: 'var(--portal-text-1b)' }}>
                Requested quantity: {currentProposal.proposedChanges.quantity}
              </p>
            )}
            {currentProposal.message && (
              <p style={{ fontSize: '0.8125rem', color: 'var(--portal-text-2)', marginTop: '0.35rem', fontStyle: 'italic' }}>
                "{currentProposal.message}"
              </p>
            )}
          </div>
        )}

        {negotiable && (
          <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap' }}>
            {!currentProposal && (
              <ActionButton primary onClick={handleAccept} disabled={actionPending} label="Accept & Confirm" icon={CheckCircle} />
            )}
            {currentProposal?.proposedByType === 'REP' && (
              <>
                <ActionButton primary onClick={() => handleAcceptProposal(currentProposal.id)} disabled={actionPending} label="Accept Counter-Offer" icon={CheckCircle} />
                <ActionButton
                  danger
                  onClick={() => { setShowRejectForm(o => !o); setShowCounterForm(false); }}
                  disabled={actionPending}
                  label={showRejectForm ? 'Cancel' : 'Reject'}
                  icon={X}
                />
              </>
            )}
            {/* Bug fix: this used to render unconditionally, so a customer whose own
                proposal was already sent and PENDING (currentProposal.proposedByType
                === 'CUSTOMER' — the "Waiting for your rep to respond" case above)
                could still open this form and fire off ANOTHER proposal before the
                rep ever responded to the first one. Only show it when there's
                nothing outstanding, or when the ball is back in the customer's
                court because the rep just countered. */}
            {(!currentProposal || currentProposal.proposedByType === 'REP') && (
              <ActionButton onClick={() => { setShowCounterForm(o => !o); setShowRejectForm(false); }} disabled={actionPending} label={showCounterForm ? 'Cancel' : 'Counter with a Discount'} icon={MessageSquare} />
            )}
          </div>
        )}

        {negotiable && currentProposal?.proposedByType === 'REP' && showRejectForm && (
          <form
            onSubmit={(e) => { e.preventDefault(); handleRejectProposal(currentProposal.id); }}
            style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
          >
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--portal-text-3)', fontWeight: '600' }}>
                Reason (optional — your rep will see this)
              </span>
              <textarea
                value={rejectMessage}
                onChange={e => setRejectMessage(e.target.value)}
                rows={2}
                placeholder="Let your rep know why this doesn't work…"
                style={{
                  padding: '0.5rem 0.75rem', borderRadius: '7px',
                  border: '1px solid var(--portal-border-strong)',
                  backgroundColor: 'var(--portal-bg)', color: 'var(--portal-text-1)',
                  fontSize: '0.8125rem', resize: 'vertical', fontFamily: 'inherit',
                }}
              />
            </label>
            <div>
              <ActionButton danger type="submit" disabled={actionPending} label="Confirm Reject" icon={X} />
            </div>
          </form>
        )}

        {negotiable && showCounterForm && (
          <form onSubmit={handleSendProposal} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--portal-text-3)', fontWeight: '600' }}>Requested discount % (optional)</span>
              <input
                type="number" min="0" max="100" step="0.5"
                value={discountPercent}
                onChange={e => setDiscountPercent(e.target.value)}
                placeholder="e.g. 15"
                style={{
                  padding: '0.5rem 0.75rem', borderRadius: '7px',
                  border: '1px solid var(--portal-border-strong)',
                  backgroundColor: 'var(--portal-bg)', color: 'var(--portal-text-1)',
                  fontSize: '0.8125rem', width: '140px',
                }}
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--portal-text-3)', fontWeight: '600' }}>Message to your rep</span>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                rows={3}
                placeholder="Explain what you'd like changed…"
                style={{
                  padding: '0.5rem 0.75rem', borderRadius: '7px',
                  border: '1px solid var(--portal-border-strong)',
                  backgroundColor: 'var(--portal-bg)', color: 'var(--portal-text-1)',
                  fontSize: '0.8125rem', resize: 'vertical', fontFamily: 'inherit',
                }}
              />
            </label>
            <div>
              <ActionButton primary type="submit" disabled={actionPending} label="Send to Rep" icon={Send} />
            </div>
          </form>
        )}
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

function ActionButton({ label, icon: Icon, onClick, disabled, primary, danger, type = 'button' }) {
  const border = danger ? '1px solid rgba(239,68,68,0.3)' : primary ? '1px solid var(--portal-accent-soft-border)' : '1px solid var(--portal-border-strong)';
  const bg = danger ? 'rgba(239,68,68,0.08)' : primary ? 'var(--portal-accent-soft-bg)' : 'transparent';
  const color = danger ? 'var(--color-danger-500)' : primary ? 'var(--portal-accent-strong)' : 'var(--portal-text-2)';
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'flex', alignItems: 'center', gap: '0.4rem',
        padding: '0.5rem 0.875rem', borderRadius: '8px',
        border, backgroundColor: bg, color,
        fontSize: '0.8125rem', fontWeight: '600',
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <Icon size={14} /> {label}
    </button>
  );
}

function EmptyNotice({ icon: Icon, color, text }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.8125rem', color: 'var(--portal-text-2)' }}>
      <Icon size={15} color={color} style={{ flexShrink: 0, marginTop: '1px' }} />
      {text}
    </div>
  );
}
