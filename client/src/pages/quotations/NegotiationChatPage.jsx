import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Send, MessageSquare, Check, X as XIcon } from 'lucide-react';
import TopBar from '../../components/layout/TopBar';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Skeleton from '../../components/ui/Skeleton';
import Input from '../../components/ui/Input';
import quotationService from '../../services/quotation.service';
import portalService from '../../services/portal.service';
import useQuotationSocket from '../../hooks/useQuotationSocket';

const STATUS_VARIANT = {
  DRAFT: 'neutral',
  PENDING_APPROVAL: 'warning',
  APPROVED: 'success',
  NEGOTIATING: 'violet',
  CONFIRMED: 'primary',
  REJECTED: 'danger',
};

/**
 * NegotiationChatPage
 *
 * Full-page negotiation view, split out of QuotationDetail.jsx so it can
 * read like an actual chat/messenger instead of sitting as just another
 * card in a two-column layout. Same data + actions as before (Accept /
 * Counter / Reject a customer's pending proposal) — just given a proper
 * chat-shaped screen: header, scrolling thread, composer pinned to the
 * bottom.
 */
export default function NegotiationChatPage() {
  const { id } = useParams();
  const [quotation, setQuotation] = useState(null);
  const [error, setError] = useState(null);
  const [counterOpenFor, setCounterOpenFor] = useState(null);
  const [counterDiscount, setCounterDiscount] = useState('');
  const [counterMessage, setCounterMessage] = useState('');
  const [counterSubmitting, setCounterSubmitting] = useState(false);
  const threadEndRef = useRef(null);

  const load = useCallback(() => {
    quotationService.detail(id).then(setQuotation).catch(() => setError('Could not load this quotation.'));
  }, [id]);

  useEffect(load, [load]);
  useQuotationSocket(id, () => load());

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ block: 'end' });
  }, [quotation?.negotiationThread?.length]);

  const handleProposalAction = async (proposalId, action, extra) => {
    try {
      await portalService.respondToProposal(proposalId, action, extra);
      load();
    } catch {
      setError('Could not respond to that message.');
    }
  };

  const handleCounterSubmit = async (proposalId) => {
    const discount = counterDiscount !== '' ? Number(counterDiscount) : undefined;
    if (discount === undefined) {
      setError('Enter a counter discount %.');
      return;
    }
    setCounterSubmitting(true);
    setError(null);
    try {
      await portalService.respondToProposal(proposalId, 'COUNTER', {
        proposedChanges: { discountPercent: discount },
        message: counterMessage.trim() || null,
      });
      setCounterOpenFor(null);
      setCounterDiscount('');
      setCounterMessage('');
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not send that counter-offer.');
    } finally {
      setCounterSubmitting(false);
    }
  };

  const thread = quotation?.negotiationThread || [];
  const pendingFromCustomer = thread.find((m) => m.from === 'CUSTOMER' && m.status === 'PENDING');

  return (
    <>
      <TopBar
        title={
          <span className="df-row-gap-8">
            <Link to={quotation ? `/quotations/${id}` : '/quotations'} className="df-icon-btn" style={{ display: 'inline-flex' }}>
              <ArrowLeft size={15} />
            </Link>
            {quotation ? `${quotation.customer.name}` : <Skeleton width={140} height={20} />}
          </span>
        }
        subtitle={quotation ? `Quotation ${quotation.id.slice(0, 8)} · Negotiation` : undefined}
        actions={quotation && <Badge variant={STATUS_VARIANT[quotation.status] || 'neutral'} dot>{quotation.status.replace('_', ' ')}</Badge>}
      />

      <div className="df-page" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - var(--topbar-height) - 48px)', maxWidth: 720, margin: '0 auto' }}>
        {error && <div className="df-error-text df-mt-8" style={{ marginBottom: 12 }}>{error}</div>}

        {!quotation ? (
          <Card><Skeleton height={220} /></Card>
        ) : (
          <>
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, padding: '4px 4px 12px' }}>
              {thread.length === 0 ? (
                <div className="df-text-sm df-text-muted" style={{ textAlign: 'center', marginTop: 40 }}>
                  <MessageSquare size={22} style={{ opacity: 0.4, marginBottom: 8 }} />
                  <div>No messages yet — negotiation starts once the customer proposes a change.</div>
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

            {/* Composer / action bar — only when there's something to respond to */}
            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 14 }}>
              {!pendingFromCustomer ? (
                <div className="df-text-sm df-text-muted" style={{ textAlign: 'center' }}>
                  Nothing waiting on you right now.
                </div>
              ) : (
                <>
                  <div className="df-row-gap-8">
                    <button type="button" className="df-btn df-btn-primary df-btn-sm" onClick={() => handleProposalAction(pendingFromCustomer.id, 'ACCEPT')}>
                      <Check size={13} /> Accept
                    </button>
                    <button
                      type="button"
                      className="df-btn df-btn-outline df-btn-sm"
                      onClick={() => {
                        setCounterOpenFor((cur) => (cur === pendingFromCustomer.id ? null : pendingFromCustomer.id));
                        setCounterDiscount('');
                        setCounterMessage('');
                      }}
                    >
                      <MessageSquare size={13} /> {counterOpenFor === pendingFromCustomer.id ? 'Cancel' : 'Counter'}
                    </button>
                    <button type="button" className="df-btn df-btn-outline df-btn-sm" onClick={() => handleProposalAction(pendingFromCustomer.id, 'REJECT')}>
                      <XIcon size={13} /> Reject
                    </button>
                  </div>

                  {counterOpenFor === pendingFromCustomer.id && (
                    <div className="df-mt-8" style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 12, borderRadius: 10, background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)' }}>
                      <Input
                        label="Counter discount %"
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        value={counterDiscount}
                        onChange={(e) => setCounterDiscount(e.target.value)}
                        placeholder="e.g. 12"
                        required
                      />
                      <div className="df-form-group">
                        <label className="df-label"><span>Message to customer</span></label>
                        <textarea
                          className="df-input"
                          rows={2}
                          value={counterMessage}
                          onChange={(e) => setCounterMessage(e.target.value)}
                          placeholder="Explain the counter-offer…"
                        />
                      </div>
                      <button
                        type="button"
                        className="df-btn df-btn-primary df-btn-sm"
                        disabled={counterSubmitting}
                        onClick={() => handleCounterSubmit(pendingFromCustomer.id)}
                      >
                        <Send size={13} /> {counterSubmitting ? 'Sending…' : 'Send Counter-Offer'}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
