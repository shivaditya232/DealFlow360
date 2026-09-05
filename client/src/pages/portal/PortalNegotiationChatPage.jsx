import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, MessageSquare, CheckCircle, X } from 'lucide-react';
import portalService from '../../services/portal.service';
import useQuotationSocket from '../../hooks/useQuotationSocket';
import QuotationStatusBadge from '../../components/customer-portal/QuotationStatusBadge';

/**
 * PortalNegotiationChatPage
 *
 * Full-page, dedicated route for a customer's negotiation on one quotation
 * (previously just an embedded "Negotiation" section on
 * PortalQuotationDetail.jsx, which felt like a plain form bolted onto the
 * page rather than an actual conversation). Lives at its own URL —
 * /portal/quotations/:id/negotiation — outside the portal's usual
 * pane-switching shell, so it reads as a real chat screen: header, scrolling
 * thread of past proposals, composer pinned to the bottom.
 *
 * Uses the same df-msg/df-msg-meta bubble classes the internal app's
 * negotiation chat uses (client/src/pages/quotations/NegotiationChatPage.jsx)
 * so the two sides of the same conversation look like the same product.
 */
export default function PortalNegotiationChatPage() {
  const { id } = useParams();
  const navigate = useNavigate();
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
  const threadEndRef = useRef(null);

  const load = useCallback(() => {
    portalService.getQuotation(id)
      .then((data) => { setQuotation(data); setError(null); })
      .catch((err) => setError(err.response?.data?.error || err.friendlyMessage || 'Failed to load this quotation.'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { load(); }, [load]);
  useQuotationSocket(id, () => load());

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ block: 'end' });
  }, [quotation?.negotiationThread?.length]);

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
      .catch((err) => setActionError(err.response?.data?.error || err.friendlyMessage || 'That action could not be completed.'))
      .finally(() => setActionPending(false));
  };

  const handleAccept = () => runAction(() => portalService.acceptQuotation(id));
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
    runAction(() => portalService.createProposal(id, {
      proposedChanges: parsedDiscount !== undefined ? { discountPercent: parsedDiscount } : null,
      message: trimmedMessage || null,
    }));
  };

  const thread = quotation?.negotiationThread || [];
  const { status, currentProposal } = quotation || {};
  const negotiable = status === 'APPROVED' || status === 'NEGOTIATING';
  const shortId = quotation?.id?.slice(-8)?.toUpperCase();

  return (
    <div className="df-portal" style={{ height: '100vh', width: '100vw', display: 'flex', justifyContent: 'center', backgroundColor: 'var(--portal-bg)', overflow: 'hidden' }}>
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%', maxWidth: '720px', height: '100%' }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: '0.75rem', padding: '1rem 1.25rem', borderBottom: '1px solid var(--portal-border)', flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
            <button
              onClick={() => navigate('/portal')}
              aria-label="Back to portal"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '32px', height: '32px', borderRadius: '8px',
                border: '1px solid var(--portal-border-strong)', backgroundColor: 'transparent',
                color: 'var(--portal-text-2)', cursor: 'pointer', flexShrink: 0,
              }}
            >
              <ArrowLeft size={16} />
            </button>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '0.9375rem', fontWeight: '700', color: 'var(--portal-text-1)' }}>
                {quotation ? `Quotation #${shortId}` : 'Loading…'}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--portal-text-4)' }}>Negotiation</div>
            </div>
          </div>
          {quotation && <QuotationStatusBadge status={status} />}
        </div>

        {(error || actionError) && (
          <div style={{
            margin: '0.75rem 1.25rem 0', padding: '0.75rem 1rem',
            backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.22)',
            borderRadius: '9px', color: 'var(--color-danger-500)', fontSize: '0.8125rem',
          }}>
            {error || actionError}
          </div>
        )}

        {/* Thread */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, padding: '1rem 1.25rem' }}>
          {loading ? (
            [1, 2, 3].map((i) => (
              <div key={i} style={{ height: '48px', borderRadius: '10px', backgroundColor: 'var(--portal-chip-bg)' }} />
            ))
          ) : thread.length === 0 ? (
            <div className="df-text-sm" style={{ textAlign: 'center', marginTop: 40, color: 'var(--portal-text-3)' }}>
              <MessageSquare size={22} style={{ opacity: 0.4, marginBottom: 8 }} />
              <div>No messages yet — send a proposal below to start negotiating.</div>
            </div>
          ) : (
            thread.map((m) => (
              <div key={m.id}>
                <div className={`df-msg ${m.from === 'CUSTOMER' ? 'customer' : 'rep'}`}>
                  {m.message && <div>{m.message}</div>}
                  {m.proposedChanges && Object.keys(m.proposedChanges).length > 0 && (
                    <div style={{ fontSize: 11.5, marginTop: 4, opacity: 0.9 }}>
                      Proposed: {Object.entries(m.proposedChanges).map(([k, v]) => `${k}: ${v}`).join(', ')}
                    </div>
                  )}
                  <div className="df-msg-meta">{m.fromName} · {new Date(m.createdAt).toLocaleString()}</div>
                </div>
              </div>
            ))
          )}
          <div ref={threadEndRef} />
        </div>

        {/* Composer / actions */}
        {!loading && quotation && (
          <div style={{ borderTop: '1px solid var(--portal-border)', padding: '1rem 1.25rem', flexShrink: 0 }}>
            {status === 'CONFIRMED' && (
              <EmptyNotice icon={CheckCircle} color="var(--color-success-500)" text="This quotation is confirmed. No further changes can be proposed." />
            )}
            {status === 'PENDING_APPROVAL' && (
              <EmptyNotice icon={MessageSquare} color="var(--color-warning-500)" text="This quotation is awaiting internal approval before it can be negotiated." />
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
                      onClick={() => { setShowRejectForm((o) => !o); setShowCounterForm(false); }}
                      disabled={actionPending}
                      label={showRejectForm ? 'Cancel' : 'Reject'}
                      icon={X}
                    />
                  </>
                )}
                {(!currentProposal || currentProposal.proposedByType === 'REP') && (
                  <ActionButton onClick={() => { setShowCounterForm((o) => !o); setShowRejectForm(false); }} disabled={actionPending} label={showCounterForm ? 'Cancel' : 'Counter with a Discount'} icon={MessageSquare} />
                )}
              </div>
            )}

            {negotiable && currentProposal?.proposedByType === 'REP' && showRejectForm && (
              <form
                onSubmit={(e) => { e.preventDefault(); handleRejectProposal(currentProposal.id); }}
                style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.75rem' }}
              >
                <label style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--portal-text-3)', fontWeight: '600' }}>
                    Reason (optional — your rep will see this)
                  </span>
                  <textarea
                    value={rejectMessage}
                    onChange={(e) => setRejectMessage(e.target.value)}
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
              <form onSubmit={handleSendProposal} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.75rem' }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--portal-text-3)', fontWeight: '600' }}>Requested discount % (optional)</span>
                  <input
                    type="number" min="0" max="100" step="0.5"
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(e.target.value)}
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
                    onChange={(e) => setMessage(e.target.value)}
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
        )}
      </div>
    </div>
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
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.8125rem', color: 'var(--portal-text-2)', marginBottom: '0.75rem' }}>
      <Icon size={15} color={color} style={{ flexShrink: 0, marginTop: '1px' }} />
      {text}
    </div>
  );
}
