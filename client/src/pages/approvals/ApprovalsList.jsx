import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import TopBar from '../../components/layout/TopBar';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Skeleton from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import approvalService from '../../services/approval.service';
import configService from '../../services/config.service';
import { resolveRiskLabel } from '../../utils/risk';

const RISK_VARIANT = { LOW: 'success', MEDIUM: 'warning', HIGH: 'danger' };

export default function ApprovalsList() {
  const navigate = useNavigate();
  const [steps, setSteps] = useState(null);
  const [limits, setLimits] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    approvalService.listPending().then(setSteps).catch(() => setError('Could not load approvals.'));
    configService.getDiscountLimits().then(setLimits).catch(() => {});
  }, []);

  const rows = useMemo(() => {
    if (!steps) return [];
    return steps.map((step) => {
      const risk = limits ? resolveRiskLabel(step.quotation.blendedRiskScore, limits.approvalChainRules) : { label: '—' };
      return {
        stepId: step.id,
        quotationId: step.quotation.id,
        customer: step.quotation.customer,
        rep: step.quotation.rep,
        approverRole: step.approverRole,
        risk: risk.label,
        // Bug fix: this used to skip tax entirely (Product.taxRate was never
        // multiplied back in), so the amount shown here understated what the
        // quotation would actually bill for.
        amount: step.quotation.lines.reduce(
          (s, l) =>
            s +
            Number(l.quantity) *
              Number(l.unitPrice) *
              (1 - Number(l.discountPercent) / 100) *
              (1 + Number(l.product?.taxRate ?? 0) / 100),
          0
        ),
      };
    });
  }, [steps, limits]);

  return (
    <>
      <TopBar
        title="Approvals"
        subtitle={steps ? `${steps.length} pending your review` : 'Loading…'}
      />
      <div className="df-page">
        {error && <div className="df-error-text" style={{ marginBottom: 16 }}>{error}</div>}

        {!steps ? (
          <Card><Skeleton height={220} /></Card>
        ) : rows.length === 0 ? (
          <Card>
            <EmptyState
              icon={<ShieldCheck size={24} />}
              title="Nothing waiting on you"
              description="Quotations that need your approval will show up here."
            />
          </Card>
        ) : (
          <Card style={{ padding: 0 }}>
            <div className="df-table-wrap">
              <table className="df-table">
                <thead>
                  <tr>
                    <th>Quotation</th>
                    <th>Customer</th>
                    <th>Rep</th>
                    <th>Amount</th>
                    <th>Blended Risk</th>
                    <th>Stage</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.stepId} onClick={() => navigate(`/approvals/${r.quotationId}`)}>
                      <td style={{ fontFamily: 'monospace', fontSize: 12.5 }}>{r.quotationId.slice(0, 8)}</td>
                      <td style={{ fontWeight: 600 }}>{r.customer.name}</td>
                      <td className="df-text-muted">{r.rep?.name ?? '—'}</td>
                      <td>${r.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                      <td><Badge variant={RISK_VARIANT[r.risk] || 'neutral'} dot>{r.risk}</Badge></td>
                      <td>{r.approverRole === 'FINANCE' ? 'Finance' : 'Sales Manager'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </>
  );
}
