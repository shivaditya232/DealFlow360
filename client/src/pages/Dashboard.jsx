import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  FileText,
  AlertTriangle,
  TrendingUp,
  Plus,
  ArrowRight,
  Activity,
  ShieldCheck,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import TopBar from '../components/layout/TopBar';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Skeleton from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import OfflineBanner from '../components/system/OfflineBanner';
import DonutChart from '../components/charts/DonutChart';
import BarChart from '../components/charts/BarChart';
import RadialGauge from '../components/charts/RadialGauge';
import dashboardService from '../services/dashboard.service';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await dashboardService.getDashboard();
      setData(res);
    } catch (err) {
      console.error('Failed to fetch dashboard metrics:', err);
      setError(err.friendlyMessage || 'Failed to connect to revenue operations backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const stats = data?.stats || { pendingApprovals: 0, openQuotations: 0, atRiskDeals: 0 };
  const recentActivity = data?.recentActivity || [];

  // Compute risk score fraction (0 to 1) for RadialGauge
  const openCount = stats.openQuotations || 0;
  const atRiskCount = stats.atRiskDeals || 0;
  const riskFraction = openCount > 0 ? Math.min(1, atRiskCount / openCount) : 0;
  const riskColor =
    riskFraction > 0.33
      ? 'var(--color-danger-500)'
      : riskFraction > 0.15
      ? 'var(--color-warning-500)'
      : 'var(--color-success-500)';

  // Chart series data
  const donutData = [
    { label: 'Pending Approval', value: stats.pendingApprovals, color: 'var(--chart-series-4)' },
    { label: 'At-Risk / Stalled', value: stats.atRiskDeals, color: 'var(--chart-series-5)' },
    {
      label: 'Active Pipeline',
      value: Math.max(0, stats.openQuotations - stats.pendingApprovals - stats.atRiskDeals),
      color: 'var(--chart-series-1)',
    },
  ];

  const barData = [
    { label: 'Active Pipeline', value: stats.openQuotations, color: 'var(--chart-series-1)' },
    { label: 'Pending Approvals', value: stats.pendingApprovals, color: 'var(--chart-series-4)' },
    { label: 'Stalled / At-Risk', value: stats.atRiskDeals, color: 'var(--chart-series-5)' },
  ];

  return (
    <div style={{ padding: '1.5rem 2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <OfflineBanner />

      <TopBar
        title={`Welcome back, ${user?.name?.split(' ')[0] || 'Team'}`}
        subtitle="Real-time revenue pipeline metrics, approval workflows, and deal health index."
        actions={
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <Button
              variant="secondary"
              size="sm"
              onClick={fetchDashboardData}
              disabled={loading}
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <RefreshCw size={14} className={loading ? 'df-spin' : ''} />
              Refresh
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/quotations')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <Plus size={15} />
              View Quotations
            </Button>
          </div>
        }
      />

      {error && (
        <Card style={{ marginBottom: '1.5rem', borderColor: 'var(--color-danger-500)', padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--color-danger-500)' }}>
              <AlertTriangle size={20} />
              <span style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{error}</span>
            </div>
            <Button variant="secondary" size="sm" onClick={fetchDashboardData}>
              Retry Connection
            </Button>
          </div>
        </Card>
      )}

      {/* KPI Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1.25rem',
          marginBottom: '1.75rem',
        }}
      >
        {/* Card 1: Pending Approvals */}
        <Card
          style={{ cursor: 'pointer', transition: 'transform 0.15s ease' }}
          onClick={() => navigate('/approvals')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                PENDING APPROVALS
              </div>
              {loading ? (
                <Skeleton width="60px" height="36px" radius="6px" />
              ) : (
                <div style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}>
                  {stats.pendingApprovals}
                </div>
              )}
            </div>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                backgroundColor: 'rgba(245, 158, 11, 0.12)',
                color: 'var(--color-warning-500)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(245, 158, 11, 0.25)',
              }}
            >
              <Clock size={20} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1.25rem' }}>
            <Badge variant="warning" dot>
              Needs Review
            </Badge>
            <span style={{ fontSize: '0.8125rem', color: 'var(--color-primary-500)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              Open Queue <ArrowRight size={13} />
            </span>
          </div>
        </Card>

        {/* Card 2: Open Quotations */}
        <Card
          style={{ cursor: 'pointer', transition: 'transform 0.15s ease' }}
          onClick={() => navigate('/quotations')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                OPEN QUOTATIONS
              </div>
              {loading ? (
                <Skeleton width="60px" height="36px" radius="6px" />
              ) : (
                <div style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}>
                  {stats.openQuotations}
                </div>
              )}
            </div>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                backgroundColor: 'rgba(37, 99, 235, 0.12)',
                color: 'var(--color-primary-500)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(37, 99, 235, 0.25)',
              }}
            >
              <FileText size={20} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1.25rem' }}>
            <Badge variant="neutral">Active Pipeline</Badge>
            <span style={{ fontSize: '0.8125rem', color: 'var(--color-primary-500)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              Manage Deals <ArrowRight size={13} />
            </span>
          </div>
        </Card>

        {/* Card 3: At-Risk Deals */}
        <Card
          style={{ cursor: 'pointer', transition: 'transform 0.15s ease' }}
          onClick={() => navigate('/quotations?status=NEGOTIATING')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                AT-RISK / STALLED DEALS
              </div>
              {loading ? (
                <Skeleton width="60px" height="36px" radius="6px" />
              ) : (
                <div style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}>
                  {stats.atRiskDeals}
                </div>
              )}
            </div>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                color: 'var(--color-danger-500)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(239, 68, 68, 0.25)',
              }}
            >
              <AlertTriangle size={20} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1.25rem' }}>
            <Badge variant={stats.atRiskDeals > 0 ? 'danger' : 'success'} dot>
              {stats.atRiskDeals > 0 ? 'Stalled > 7 Days' : 'Healthy Pipeline'}
            </Badge>
            <span style={{ fontSize: '0.8125rem', color: 'var(--color-primary-500)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              Inspect Stalled <ArrowRight size={13} />
            </span>
          </div>
        </Card>
      </div>

      {/* Analytics & Visualization Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.25rem',
          marginBottom: '1.75rem',
        }}
      >
        {/* Analytics Card 1: Donut Breakdown */}
        <Card style={{ padding: '1.5rem' }}>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={18} style={{ color: 'var(--color-primary-500)' }} />
            Deal Breakdown
          </div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            Proportional distribution across operational statuses
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
              <Skeleton width="140px" height="140px" radius="50%" />
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', gap: '1rem' }}>
              <DonutChart
                data={donutData}
                size={150}
                thickness={18}
                centerValue={stats.openQuotations}
                centerLabel="Total Deals"
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.8125rem' }}>
                {donutData.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: item.color }} />
                    <span style={{ color: 'var(--text-secondary)' }}>{item.label}:</span>
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Analytics Card 2: Risk Health Gauge */}
        <Card style={{ padding: '1.5rem' }}>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Zap size={18} style={{ color: 'var(--accent-amber-500)' }} />
            Pipeline Health Gauge
          </div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            Real-time percentage of deals requiring immediate operational intervention
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
              <Skeleton width="160px" height="80px" radius="10px" />
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <RadialGauge
                fraction={riskFraction}
                color={riskColor}
                size={160}
                value={`${Math.round(riskFraction * 100)}%`}
                label="Risk Index"
              />
              <div style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                {atRiskCount === 0 ? (
                  <span style={{ color: 'var(--color-success-500)', fontWeight: 600 }}>
                    ✨ Excellent! All open deals are actively moving forward.
                  </span>
                ) : (
                  <span>
                    <strong>{atRiskCount}</strong> deal(s) have been stagnant for more than 7 days.
                  </span>
                )}
              </div>
            </div>
          )}
        </Card>

        {/* Analytics Card 3: Pipeline Comparison Bar Chart */}
        <Card style={{ padding: '1.5rem' }}>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={18} style={{ color: 'var(--accent-violet-500)' }} />
            Volume Comparison
          </div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            Comparative deal counts by category
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <Skeleton width="100%" height="24px" radius="6px" />
              <Skeleton width="100%" height="24px" radius="6px" />
              <Skeleton width="100%" height="24px" radius="6px" />
            </div>
          ) : (
            <BarChart data={barData} height={20} />
          )}
        </Card>
      </div>

      {/* Recent Activity Audit Feed Section */}
      <Card style={{ padding: '1.5rem' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1.25rem',
            paddingBottom: '0.75rem',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={18} style={{ color: 'var(--color-primary-500)' }} />
            <h2 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              Recent Audit Activity Feed
            </h2>
          </div>
          <Badge variant="neutral">{recentActivity.length} Recent Actions</Badge>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <Skeleton width="100%" height="40px" radius="8px" />
            <Skeleton width="100%" height="40px" radius="8px" />
            <Skeleton width="100%" height="40px" radius="8px" />
          </div>
        ) : recentActivity.length === 0 ? (
          <EmptyState
            icon={<Activity size={32} style={{ color: 'var(--text-muted)' }} />}
            title="No Recent Audit Logs"
            description="Operations events like quotation creations, approvals, and negotiations will appear here in real time."
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {recentActivity.map((act) => (
              <div
                key={act.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.85rem 1rem',
                  borderRadius: '8px',
                  backgroundColor: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(37, 99, 235, 0.1)',
                      color: 'var(--color-primary-500)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Activity size={15} />
                  </div>
                  <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                    {act.text}
                  </span>
                </div>

                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                  {new Date(act.createdAt).toLocaleString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

