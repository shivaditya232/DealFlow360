import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Check, RotateCcw, X as XIcon } from 'lucide-react';
import TopBar from '../../components/layout/TopBar';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Skeleton from '../../components/ui/Skeleton';
import RadialGauge from '../../components/charts/RadialGauge';
import approvalService from '../../services/approval.service';
import configService from '../../services/config.service';
import { resolveRiskLabel, RISK_COLORS } from '../../utils/risk';

const RISK_VARIANT = { LOW: 'success', MEDIUM: 'warning', HIGH: 'danger' };

function StepDot({ status }) {
  if (status === 'APPROVED' || status === 'DONE') return <div className="df-stepper-dot done"><Check size={13} /></div>;
  if (status === 'REJECTED') return <div className="df-stepper-dot rejected"><XIcon size={13} /></div>;
  if (status === 'PENDING') return <div className="df-stepper-dot active">•</div>;
  return <div className="df-stepper-dot">•</div>;
}

export default function ApprovalDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [detail, setDetail] = useState(null);
  const [limits, setLimits] = useState(null);
  const [reasonFor, setReasonFor] = useState(null); // 'REJECT' | 'RETURN' | null
  const [reason, setReason] = useState('');
  const [acting, setActing] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    approvalService.detail(id).then(setDetail).catch(() => setError('Could not load approval detail.'));
  }, [id]);

  useEffect(load, [load]);
  useEffect(() => { configService.getDiscountLimits().then(setLimits).catch(() => {}); }, []);

  const risk = detail && limits ? resolveRiskLabel(detail.blendedRiskScore, limits.approvalChainRules) : null;

  const pendingStep = detail?.approvalSteps.find((s) => s.status === 'PENDING');

  const act = async (action) => {
    if ((action === 'REJECT' || action === 'RETURN') && reasonFor !== action) {
      setReasonFor(action);
      return;
    }
    setActing(true);
    setError(null);
    try {
      await approvalService.act(id, action, reason || undefined);
      setReasonFor(null);
      setReason('');
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not record that decision.');
    } finally {
      setActing(false);
    }
  };

  return (
    <>
      <TopBar
        title={
          <span className="df-row-gap-8">
            <Link to="/approvals" className="df-icon-btn" style={{ display: 'inline-flex' }}>
              <ArrowLeft size={15} />
            </Link>
            {detail ? detail.customer.name : <Skeleton width={140} height={20} />}
          </span>
        }
        subtitle={detail ? `Quotation ${detail.id.slice(0, 8)} · ${detail.customer.tier} tier` : undefined}
        actions={detail && <Badge variant={{ PENDING_APPROVAL: 'warning', APPROVED: 'success', REJECTED: 'danger' }[detail.status] || 'neutral'} dot>{detail.status.replace('_', ' ')}</Badge>}
      />

      <div className="df-page">
        {error && <div className="df-error-text" style={{ marginBottom: 16 }}>{error}</div>}

        {!detail ? (
          <Card><Skeleton height={260} /></Card>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, alignItems: 'start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <Card>
                <div className="df-card-title df-mt-8" style={{ marginBottom: 14 }}>Approval Chain</div>
                <div className="df-stepper">
                  <div className="df-stepper-node">
                    <div className="df-stepper-dot done"><Check size={13} /></div>
                    <div className="df-stepper-label">Submitted</div>
                  </div>
                  {detail.approvalSteps.map((s) => (
                    <React.Fragment key={s.id}>
                      <div className="df-stepper-line" />
                      <div className="df-stepper-node">
                        <StepDot status={s.status} />
                        <div className="df-stepper-label">{s.approverRole === 'FINANCE' ? 'Finance' : 'Sales Manager'}</div>
                      </div>
                    </React.Fragment>
                  ))}
                  <div className="df-stepper-line" />
                  <div className="df-stepper-node">
                    <div className={`df-stepper-dot ${detail.status === 'CONFIRMED' ? 'done' : ''}`}>
                      {detail.status === 'CONFIRMED' ? <Check size={13} /> : '•'}
                    </div>
                    <div className="df-stepper-label">Confirmed</div>
                  </div>
                </div>
              </Card>

              <Card>
                <div className="df-card-title df-mt-8" style={{ marginBottom: 14 }}>Why This Quote Was Flagged</div>
                <div className="df-table-wrap">
                  <table className="df-table">
                    <thead>
                      <tr><th>Line</th><th>Discount Given</th><th>Limit Allowed</th><th>Over By</th></tr>
                    </thead>
                    <tbody>
                      {detail.lines.map((l) => (
                        <tr key={l.id} style={{ cursor: 'default' }}>
                          <td style={{ fontWeight: 600 }}>{l.productName} <span className="df-text-muted">({l.category})</span></td>
                          <td>{l.discountPercent}%</td>
                          <td className="df-text-muted">{l.limit}%</td>
                          <td>
                            {l.overagePoints > 0
                              ? <span className={`df-line-status over`}>+{l.overagePoints}pt OVER</span>
                              : <span className="df-line-status ok">OK</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>

              <Card>
                <div className="df-card-title df-mt-8" style={{ marginBottom: 14 }}>Audit Trail</div>
                {detail.auditTrail.length === 0 ? (
                  <div className="df-text-sm df-text-muted">No actions recorded yet.</div>
                ) : (
                  <div className="df-table-wrap">
                    <table className="df-table">
                      <thead><tr><th>User</th><th>Action</th><th>Date</th><th>Note</th></tr></thead>
                      <tbody>
                        {detail.auditTrail.map((a, i) => (
                          <tr key={i} style={{ cursor: 'default' }}>
                            <td>{a.user}</td>
                            <td>{a.action}</td>
                            <td className="df-text-muted">{new Date(a.date).toLocaleString()}</td>
                            <td className="df-text-muted">{a.note || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20, position: 'sticky', top: 88 }}>
              <Card style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                {risk && (
                  <>
                    <RadialGauge
                      fraction={Math.min(1, Number(detail.blendedRiskScore || 0) / 40)}
                      color={RISK_COLORS[risk.label]}
                      value={Number(detail.blendedRiskScore || 0).toFixed(0)}
                      label="risk score"
                    />
                    <Badge variant={RISK_VARIANT[risk.label]} dot>{risk.label} RISK</Badge>
                  </>
                )}
              </Card>

              {pendingStep && (
                <Card>
                  <div className="df-card-title df-mt-8" style={{ marginBottom: 4 }}>
                    Awaiting {pendingStep.approverRole === 'FINANCE' ? 'Finance' : 'Sales Manager'} decision
                  </div>
                  <div className="df-text-sm df-text-muted df-mt-8">
                    Approving advances the chain{detail.approvalSteps.some((s) => s.approverRole === 'FINANCE') ? ' (Manager → Finance)' : ''}.
                  </div>

                  {reasonFor && (
                    <textarea
                      className="df-input df-mt-16"
                      rows={3}
                      placeholder={`Reason for ${reasonFor === 'REJECT' ? 'rejecting' : 'returning'} (required)`}
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                    />
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }} className="df-mt-16">
                    <button type="button" className="df-btn df-btn-primary df-btn-sm" disabled={acting} onClick={() => act('APPROVE')}>
                      <Check size={14} /> Approve
                    </button>
                    <button type="button" className="df-btn df-btn-outline df-btn-sm" disabled={acting || (reasonFor === 'RETURN' && !reason)} onClick={() => act('RETURN')}>
                      <RotateCcw size={14} /> {reasonFor === 'RETURN' ? 'Confirm Return' : 'Return for Revision'}
                    </button>
                    <button
                      type="button"
                      className="df-btn df-btn-sm"
                      style={{ color: 'var(--color-danger-600)', border: '1px solid var(--color-danger-200)', background: 'var(--color-danger-50)' }}
                      disabled={acting || (reasonFor === 'REJECT' && !reason)}
                      onClick={() => act('REJECT')}
                    >
                      <XIcon size={14} /> {reasonFor === 'REJECT' ? 'Confirm Reject' : 'Reject'}
                    </button>
                  </div>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
