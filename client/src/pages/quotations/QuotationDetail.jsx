import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Sparkles, Send, MessageSquare, Check, X as XIcon } from 'lucide-react';
import TopBar from '../../components/layout/TopBar';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Skeleton from '../../components/ui/Skeleton';
import AddLineModal from './AddLineModal';
import quotationService from '../../services/quotation.service';
import configService from '../../services/config.service';
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

export default function QuotationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quotation, setQuotation] = useState(null);
  const [upsell, setUpsell] = useState([]);
  const [discountLimits, setDiscountLimits] = useState(null);
  const [addLineOpen, setAddLineOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);

  const load = useCallback(() => {
    quotationService.detail(id).then(setQuotation).catch(() => setError('Could not load this quotation.'));
    quotationService.upsellSuggestions(id).then(setUpsell).catch(() => {});
  }, [id]);

  useEffect(load, [load]);
  useEffect(() => { configService.getDiscountLimits().then(setDiscountLimits).catch(() => {}); }, []);

  // Live updates: any broadcast for this quotation (a new/countered/accepted
  // proposal, a status change from the approval chain, etc.) just re-fetches
  // rather than patching state in place — several backend services can touch
  // the same quotation and we want a single source of truth per refresh.
  useQuotationSocket(id, () => load());

  const isDraft = quotation?.status === 'DRAFT';

  const handleDeleteLine = async (lineId) => {
    try {
      await quotationService.deleteLine(id, lineId);
      load();
    } catch {
      setError('Could not remove that line.');
    }
  };

  const handleAddUpsell = async (productId) => {
    try {
      await quotationService.addLine(id, { productId, quantity: 1, discountPercent: 0 });
      load();
    } catch {
      setError('Could not add that suggestion.');
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const result = await quotationService.submit(id);
      setNotice(
        result.status === 'APPROVED'
          ? 'Auto-approved — within discount limits.'
          : 'Submitted — routed for approval.'
      );
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not submit for approval.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleProposalAction = async (proposalId, action) => {
    try {
      await portalService.respondToProposal(proposalId, action);
      load();
    } catch {
      setError('Could not respond to that message.');
    }
  };

  if (error && !quotation) {
    return (
      <div className="df-page">
        <div className="df-error-text">{error}</div>
      </div>
    );
  }

  return (
    <>
      <TopBar
        title={
          <span className="df-row-gap-8">
            <Link to="/quotations" className="df-icon-btn" style={{ display: 'inline-flex' }}>
              <ArrowLeft size={15} />
            </Link>
            {quotation ? `${quotation.customer.name}` : <Skeleton width={140} height={20} />}
          </span>
        }
        subtitle={quotation ? `Quotation ${quotation.id.slice(0, 8)} · Rep ${quotation.rep?.name ?? '—'}` : undefined}
        actions={
          quotation && (
            <>
              <Badge variant={STATUS_VARIANT[quotation.status] || 'neutral'} dot>{quotation.status.replace('_', ' ')}</Badge>
              {isDraft && (
                <button type="button" className="df-btn df-btn-primary df-btn-sm" onClick={handleSubmit} disabled={submitting}>
                  <Send size={14} /> {submitting ? 'Submitting…' : 'Submit for Approval'}
                </button>
              )}
            </>
          )
        }
      />

      <div className="df-page">
        {error && <div className="df-error-text df-mt-8" style={{ marginBottom: 16 }}>{error}</div>}
        {notice && <div style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 10, background: 'var(--color-success-50)', color: 'var(--color-success-700)', fontSize: 13, fontWeight: 600 }}>{notice}</div>}

        {!quotation ? (
          <Card><Skeleton height={220} /></Card>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, alignItems: 'start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <Card style={{ padding: 0 }}>
                <div className="df-card-header" style={{ padding: '18px 20px 0' }}>
                  <div>
                    <div className="df-card-title">Line Items</div>
                    <div className="df-card-subtitle">{quotation.customer.tier} tier · discount checked live against each line's own limit</div>
                  </div>
                  {isDraft && (
                    <button type="button" className="df-btn df-btn-outline df-btn-sm" onClick={() => setAddLineOpen(true)}>
                      <Plus size={14} /> Add Product
                    </button>
                  )}
                </div>

                <div className="df-table-wrap" style={{ marginTop: 12 }}>
                  <table className="df-table">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Qty</th>
                        <th>Price</th>
                        <th>Discount</th>
                        <th>Limit</th>
                        <th>Status</th>
                        {isDraft && <th></th>}
                      </tr>
                    </thead>
                    <tbody>
                      {quotation.lines.map((line) => (
                        <tr key={line.id} style={{ cursor: 'default' }}>
                          <td>
                            <div style={{ fontWeight: 600 }}>{line.product.name}</div>
                            <div className="df-text-sm df-text-muted">
                              {line.product.category}{line.variant ? ` · ${line.variant.attributeValue}` : ''}
                            </div>
                          </td>
                          <td>{line.quantity}</td>
                          <td>${Number(line.unitPrice).toLocaleString()}</td>
                          <td>{Number(line.discountPercent)}%</td>
                          <td className="df-text-muted">{line.limit}%</td>
                          <td>
                            <span className={`df-line-status ${line.status.startsWith('OVER') ? 'over' : 'ok'}`}>
                              {line.status}
                            </span>
                          </td>
                          {isDraft && (
                            <td>
                              <button type="button" className="df-icon-btn" style={{ border: 'none' }} onClick={() => handleDeleteLine(line.id)} aria-label="Remove line">
                                <Trash2 size={14} />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                      {quotation.lines.length === 0 && (
                        <tr>
                          <td colSpan={isDraft ? 7 : 6} className="df-text-muted" style={{ textAlign: 'center', padding: 24 }}>
                            No products added yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <div style={{ padding: '4px 20px 20px' }} />
              </Card>

              {upsell.length > 0 && (
                <Card>
                  <div className="df-card-header">
                    <div>
                      <div className="df-card-title">Upsell &amp; Cross-Sell Suggestions</div>
                      <div className="df-card-subtitle">Margin-qualified add-ons based on what's already in the cart</div>
                    </div>
                    <Sparkles size={18} style={{ color: 'var(--accent-violet-500)' }} />
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                    {upsell.map((s) => (
                      <div key={s.productId} style={{ flex: '1 1 200px', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: 14, background: 'var(--bg-surface)' }}>
                        <div className="df-flex-between">
                          <div style={{ fontWeight: 700, fontSize: 13.5 }}>{s.name}</div>
                          {s.isPromoted && <Badge variant="violet">Promo</Badge>}
                        </div>
                        <div className="df-text-sm" style={{ color: 'var(--color-success-600)', fontWeight: 600, margin: '6px 0 10px' }}>
                          Margin +${s.marginAmount.toLocaleString()}
                        </div>
                        {isDraft && (
                          <button type="button" className="df-btn df-btn-outline df-btn-sm" style={{ width: '100%' }} onClick={() => handleAddUpsell(s.productId)}>
                            <Plus size={13} /> Add to Quote
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              <Card>
                <div className="df-card-header">
                  <div>
                    <div className="df-card-title">Negotiation Thread</div>
                    <div className="df-card-subtitle">Messages &amp; counter-offers with the customer</div>
                  </div>
                  <MessageSquare size={18} className="df-text-muted" />
                </div>

                {quotation.negotiationThread.length === 0 ? (
                  <div className="df-text-sm df-text-muted">No messages yet.</div>
                ) : (
                  <div className="df-thread">
                    {quotation.negotiationThread.map((m) => (
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
                        {m.from === 'CUSTOMER' && m.status === 'PENDING' && (
                          <div className="df-row-gap-8 df-mt-8">
                            <button type="button" className="df-btn df-btn-primary df-btn-sm" onClick={() => handleProposalAction(m.id, 'ACCEPT')}>
                              <Check size={13} /> Accept
                            </button>
                            <button type="button" className="df-btn df-btn-outline df-btn-sm" onClick={() => handleProposalAction(m.id, 'REJECT')}>
                              <XIcon size={13} /> Reject
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20, position: 'sticky', top: 88 }}>
              <Card>
                <div className="df-card-title df-mt-8" style={{ marginBottom: 14 }}>Summary</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
                  <div className="df-flex-between"><span className="df-text-muted">Customer</span><span style={{ fontWeight: 600 }}>{quotation.customer.name}</span></div>
                  <div className="df-flex-between"><span className="df-text-muted">Tier</span><Badge variant="primary">{quotation.customer.tier}</Badge></div>
                  <div className="df-flex-between"><span className="df-text-muted">Rep</span><span>{quotation.rep?.name ?? '—'}</span></div>
                  <div className="df-flex-between"><span className="df-text-muted">Lines</span><span>{quotation.lines.length}</span></div>
                  <div className="df-flex-between" style={{ paddingTop: 10, borderTop: '1px solid var(--border-subtle)' }}>
                    <span className="df-text-muted">Total</span>
                    <span style={{ fontWeight: 800, fontSize: 16 }}>
                      ${quotation.lines.reduce((s, l) => s + l.lineTotal, 0).toLocaleString()}
                    </span>
                  </div>
                  {quotation.blendedRiskScore != null && (
                    <div className="df-flex-between">
                      <span className="df-text-muted">Blended Risk Score</span>
                      <span style={{ fontWeight: 700 }}>{Number(quotation.blendedRiskScore).toFixed(1)}</span>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>

      {quotation && (
        <AddLineModal
          open={addLineOpen}
          onClose={() => setAddLineOpen(false)}
          quotationId={id}
          customerTier={quotation.customer.tier}
          discountLimits={discountLimits}
          onAdded={() => { setAddLineOpen(false); load(); }}
        />
      )}
    </>
  );
}
