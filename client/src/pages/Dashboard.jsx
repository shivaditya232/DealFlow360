import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, FileStack, AlertTriangle, Plus, ShieldCheck, ArrowUpRight, Activity } from 'lucide-react';
import TopBar from '../components/layout/TopBar';
import Card from '../components/ui/Card';
import Skeleton from '../components/ui/Skeleton';
import DonutChart from '../components/charts/DonutChart';
import dashboardService from '../services/dashboard.service';
import quotationService from '../services/quotation.service';
import { useAuth } from '../context/AuthContext';
import { APPROVALS_ROLES } from '../config/roleAccess';

const STATUS_META = {
  DRAFT: { label: 'Draft', color: 'var(--chart-track)' },
  PENDING_APPROVAL: { label: 'Pending Approval', color: 'var(--chart-series-4)' },
  APPROVED: { label: 'Approved', color: 'var(--chart-series-3)' },
  NEGOTIATING: { label: 'Negotiating', color: 'var(--chart-series-2)' },
  CONFIRMED: { label: 'Confirmed', color: 'var(--chart-series-1)' },
  REJECTED: { label: 'Rejected', color: 'var(--chart-series-5)' },
};

function StatTile({ icon: Icon, gradient, value, label, to }) {
  const content = (
    <Card className="df-stat-card">
      <div className="df-stat-icon" style={{ background: gradient }}>
        <Icon size={19} />
      </div>
      <div>
        <div className="df-stat-value">{value}</div>
        <div className="df-stat-label">{label}</div>
      </div>
    </Card>
  );
  return to ? <Link to={to} style={{ textDecoration: 'none' }}>{content}</Link> : content;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [dash, setDash] = useState(null);
  const [quotations, setQuotations] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([dashboardService.getDashboard(), quotationService.list()])
      .then(([d, q]) => {
        if (cancelled) return;
        setDash(d);
        setQuotations(q);
      })
      .catch(() => !cancelled && setError('Could not load dashboard data.'));
    return () => { cancelled = true; };
  }, []);

  const statusBreakdown = useMemo(() => {
    if (!quotations) return [];
    const counts = {};
    quotations.forEach((q) => { counts[q.status] = (counts[q.status] || 0) + 1; });
    return Object.entries(counts).map(([status, value]) => ({
      label: STATUS_META[status]?.label || status,
      value,
      color: STATUS_META[status]?.color || 'var(--chart-track)',
    }));
  }, [quotations]);

  const totalPipelineValue = useMemo(
    () => (quotations || []).reduce((sum, q) => sum + (q.amount || 0), 0),
    [quotations]
  );

  const firstName = user?.name?.split(' ')[0];
  // Reps see this count too (it's company-wide), but /approvals is the
  // Manager/Finance/Admin action screen — send everyone else to their own
  // Quotations board instead, which already groups by status.
  const pendingApprovalsHref = APPROVALS_ROLES.includes(user?.role) ? '/approvals' : '/quotations?status=PENDING_APPROVAL';

  return (
    <>
      <TopBar
        title={`Welcome back${firstName ? `, ${firstName}` : ''}`}
        subtitle="Here's what's moving across your pipeline today"
        actions={
          <Link to="/quotations" className="df-btn df-btn-primary df-btn-sm">
            <Plus size={15} /> New Quotation
          </Link>
        }
      />
      <div className="df-page">
        {error && <div className="df-error-text" style={{ marginBottom: 16 }}>{error}</div>}

        <div className="df-stat-grid">
          {!dash ? (
            [1, 2, 3].map((i) => <Card key={i}><Skeleton height={72} /></Card>)
          ) : (
            <>
              <StatTile
                icon={ClipboardList}
                gradient="linear-gradient(135deg, var(--color-warning-500), #fbbf24)"
                value={dash.stats.pendingApprovals}
                label="Pending Approvals"
                to={pendingApprovalsHref}
              />
              <StatTile
                icon={FileStack}
                gradient="linear-gradient(135deg, var(--color-primary-600), var(--accent-violet-600))"
                value={dash.stats.openQuotations}
                label="Open Quotations"
                to="/quotations"
              />
              <StatTile
                icon={AlertTriangle}
                gradient="linear-gradient(135deg, var(--color-danger-500), #f87171)"
                value={dash.stats.atRiskDeals}
                label="At-Risk Deals (idle 7+ days)"
              />
            </>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 1.1fr) 1.4fr', gap: 20 }}>
          <Card>
            <div className="df-card-header">
              <div>
                <div className="df-card-title">Pipeline by Stage</div>
                <div className="df-card-subtitle">
                  {quotations ? `${quotations.length} quotations · $${totalPipelineValue.toLocaleString()} total` : 'Loading…'}
                </div>
              </div>
            </div>

            {!quotations ? (
              <Skeleton height={140} radius="50%" style={{ margin: '0 auto', width: 140 }} />
            ) : quotations.length === 0 ? (
              <div className="df-text-sm df-text-muted" style={{ textAlign: 'center', padding: '24px 0' }}>
                No quotations yet — create your first one.
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
                <DonutChart data={statusBreakdown} centerValue={quotations.length} centerLabel="Quotes" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, minWidth: 140 }}>
                  {statusBreakdown.map((s) => (
                    <div key={s.label} className="df-row-gap-8" style={{ fontSize: 12.5 }}>
                      <span style={{ width: 9, height: 9, borderRadius: 3, background: s.color, flexShrink: 0 }} />
                      <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{s.label}</span>
                      <span style={{ marginLeft: 'auto', color: 'var(--text-muted)' }}>{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>

          <Card>
            <div className="df-card-header">
              <div>
                <div className="df-card-title">Recent Activity</div>
                <div className="df-card-subtitle">Latest actions across your company</div>
              </div>
              <Activity size={18} className="df-text-muted" />
            </div>

            {!dash ? (
              [1, 2, 3, 4].map((i) => <Skeleton key={i} height={18} style={{ marginBottom: 12 }} />)
            ) : dash.recentActivity.length === 0 ? (
              <div className="df-text-sm df-text-muted">Nothing's happened yet — activity will show up here.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {dash.recentActivity.map((a, i) => (
                  <div
                    key={a.id}
                    style={{
                      display: 'flex',
                      gap: 12,
                      padding: '11px 0',
                      borderBottom: i === dash.recentActivity.length - 1 ? 'none' : '1px solid var(--border-subtle)',
                    }}
                  >
                    <ArrowUpRight size={15} style={{ color: 'var(--color-primary-600)', marginTop: 2, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>{a.text}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                        {new Date(a.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
