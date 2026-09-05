import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  AlertTriangle, 
  Clock, 
  TrendingUp, 
  Truck, 
  ArrowUpRight, 
  Flame, 
  RefreshCw,
  CheckCircle2,
  ShieldAlert
} from 'lucide-react';
import TopBar from '../../components/layout/TopBar';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Skeleton from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import Button from '../../components/ui/Button';
import dashboardService from '../../services/dashboard.service';

export default function DealHealth() {
  const [activeTab, setActiveTab] = useState('stalled'); // 'stalled' | 'anomalies' | 'slippage'
  const [stalledDeals, setStalledDeals] = useState([]);
  const [anomalies, setAnomalies] = useState([]);
  const [slippage, setSlippage] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [escalatingId, setEscalatingId] = useState(null);
  const [notice, setNotice] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [stalled, anom, slip] = await Promise.all([
        dashboardService.getStalledDeals(),
        dashboardService.getAnomalies(),
        dashboardService.getDeliverySlippage(),
      ]);
      setStalledDeals(stalled || []);
      setAnomalies(anom || []);
      setSlippage(slip || []);
    } catch (err) {
      setError(err.response?.data?.error || err.friendlyMessage || 'Failed to load deal health data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleEscalate = async (quotationId) => {
    setEscalatingId(quotationId);
    setNotice(null);
    try {
      await dashboardService.escalate(quotationId);
      setNotice(`Quotation #${quotationId.slice(-8).toUpperCase()} has been escalated to the sales team.`);
      // Refresh to update activity timestamps
      loadData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to escalate quotation.');
    } finally {
      setEscalatingId(null);
    }
  };

  const tabs = [
    { id: 'stalled', label: 'Stalled Deals', count: stalledDeals.length, icon: Clock },
    { id: 'anomalies', label: 'Discount Anomalies', count: anomalies.length, icon: TrendingUp },
    { id: 'slippage', label: 'Delivery Slippage', count: slippage.length, icon: Truck },
  ];

  return (
    <>
      <TopBar
        title="Deal Health Monitoring"
        subtitle="Proactively track stalled pipelines, excessive discount patterns, and delivery delays."
        actions={
          <button
            type="button"
            className="df-btn df-btn-outline df-btn-sm"
            onClick={loadData}
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        }
      />

      <div className="df-page">
        {error && (
          <div className="df-status-banner df-status-banner-error" style={{ marginBottom: 16 }}>
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
        )}

        {notice && (
          <div className="df-status-banner df-status-banner-success" style={{ marginBottom: 16 }}>
            <CheckCircle2 size={18} />
            <span>{notice}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 10 }}>
          {tabs.map(({ id, label, count, icon: Icon }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 14px',
                  borderRadius: 8,
                  border: 'none',
                  background: isActive ? 'var(--color-primary-50)' : 'transparent',
                  color: isActive ? 'var(--color-primary-700)' : 'var(--text-secondary)',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: 13.5,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <Icon size={16} />
                <span>{label}</span>
                <span
                  style={{
                    backgroundColor: isActive ? 'var(--color-primary-600)' : 'var(--border-medium)',
                    color: '#fff',
                    borderRadius: 999,
                    padding: '1px 7px',
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {loading ? (
          <Card>
            <Skeleton height={260} />
          </Card>
        ) : (
          <>
            {/* TAB 1: STALLED DEALS */}
            {activeTab === 'stalled' && (
              <Card style={{ padding: 0 }}>
                <div className="df-card-header" style={{ padding: '18px 20px' }}>
                  <div>
                    <div className="df-card-title">Stalled Deals (Inactive 7+ Days)</div>
                    <div className="df-card-subtitle">
                      Open quotations with zero negotiations, approvals, or edits in the past week.
                    </div>
                  </div>
                </div>

                {stalledDeals.length === 0 ? (
                  <div style={{ padding: 32 }}>
                    <EmptyState
                      icon={<Clock size={24} />}
                      title="No stalled deals"
                      description="All active pipeline quotations have had recorded activity within the last 7 days."
                    />
                  </div>
                ) : (
                  <div className="df-table-wrap">
                    <table className="df-table">
                      <thead>
                        <tr>
                          <th>Quotation</th>
                          <th>Customer</th>
                          <th>Assigned Rep</th>
                          <th>Status</th>
                          <th>Inactive Duration</th>
                          <th>Last Activity</th>
                          <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stalledDeals.map((deal) => (
                          <tr key={deal.quotationId}>
                            <td>
                              <Link
                                to={`/quotations/${deal.quotationId}`}
                                style={{ fontWeight: 700, color: 'var(--color-primary-600)', textDecoration: 'none' }}
                              >
                                #{deal.quotationId.slice(-8).toUpperCase()}
                                <ArrowUpRight size={13} style={{ display: 'inline', marginLeft: 3 }} />
                              </Link>
                            </td>
                            <td style={{ fontWeight: 600 }}>{deal.customerName}</td>
                            <td>{deal.repName}</td>
                            <td>
                              <Badge variant="warning" dot>
                                {deal.status}
                              </Badge>
                            </td>
                            <td>
                              <span style={{ color: 'var(--color-danger-600)', fontWeight: 700 }}>
                                {deal.daysSinceActivity} days ago
                              </span>
                            </td>
                            <td className="df-text-muted">
                              {new Date(deal.lastActivityAt).toLocaleDateString()}
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <button
                                type="button"
                                className="df-btn df-btn-outline df-btn-sm"
                                disabled={escalatingId === deal.quotationId}
                                onClick={() => handleEscalate(deal.quotationId)}
                              >
                                <Flame size={13} color="var(--color-danger-500)" />
                                {escalatingId === deal.quotationId ? 'Escalating…' : 'Escalate'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            )}

            {/* TAB 2: DISCOUNT ANOMALIES */}
            {activeTab === 'anomalies' && (
              <Card style={{ padding: 0 }}>
                <div className="df-card-header" style={{ padding: '18px 20px' }}>
                  <div>
                    <div className="df-card-title">Discount Anomalies (&gt; 5pp Above Rep Baseline)</div>
                    <div className="df-card-subtitle">
                      Quotations with overall discount rates significantly exceeding the rep's historical average.
                    </div>
                  </div>
                </div>

                {anomalies.length === 0 ? (
                  <div style={{ padding: 32 }}>
                    <EmptyState
                      icon={<TrendingUp size={24} />}
                      title="No discount anomalies"
                      description="No active quotations currently deviate by more than 5 points from their sales rep baseline."
                    />
                  </div>
                ) : (
                  <div className="df-table-wrap">
                    <table className="df-table">
                      <thead>
                        <tr>
                          <th>Quotation</th>
                          <th>Customer</th>
                          <th>Rep Name</th>
                          <th>Deal Discount</th>
                          <th>Rep Baseline</th>
                          <th>Excess Points</th>
                          <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {anomalies.map((anom) => (
                          <tr key={anom.quotationId}>
                            <td>
                              <Link
                                to={`/quotations/${anom.quotationId}`}
                                style={{ fontWeight: 700, color: 'var(--color-primary-600)', textDecoration: 'none' }}
                              >
                                #{anom.quotationId.slice(-8).toUpperCase()}
                                <ArrowUpRight size={13} style={{ display: 'inline', marginLeft: 3 }} />
                              </Link>
                            </td>
                            <td style={{ fontWeight: 600 }}>{anom.customerName}</td>
                            <td>{anom.repName}</td>
                            <td>
                              <strong style={{ color: 'var(--color-danger-600)' }}>
                                {anom.overallDiscountPercent}%
                              </strong>
                            </td>
                            <td className="df-text-muted">{anom.repAvgDiscountPercent}%</td>
                            <td>
                              <Badge variant="danger" dot>
                                +{anom.excessPoints} pt excess
                              </Badge>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <button
                                type="button"
                                className="df-btn df-btn-outline df-btn-sm"
                                disabled={escalatingId === anom.quotationId}
                                onClick={() => handleEscalate(anom.quotationId)}
                              >
                                <Flame size={13} color="var(--color-danger-500)" />
                                {escalatingId === anom.quotationId ? 'Escalating…' : 'Escalate'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            )}

            {/* TAB 3: DELIVERY SLIPPAGE */}
            {activeTab === 'slippage' && (
              <Card style={{ padding: 0 }}>
                <div className="df-card-header" style={{ padding: '18px 20px' }}>
                  <div>
                    <div className="df-card-title">Delivery Slippage</div>
                    <div className="df-card-subtitle">
                      Fulfilled orders whose actual fulfillment completion occurred after the promised date.
                    </div>
                  </div>
                </div>

                {slippage.length === 0 ? (
                  <div style={{ padding: 32 }}>
                    <EmptyState
                      icon={<Truck size={24} />}
                      title="Zero delivery slippage"
                      description="All fulfilled orders were completed on or before their promised delivery dates."
                    />
                  </div>
                ) : (
                  <div className="df-table-wrap">
                    <table className="df-table">
                      <thead>
                        <tr>
                          <th>Quotation</th>
                          <th>Customer</th>
                          <th>Assigned Rep</th>
                          <th>Promised Date</th>
                          <th>Actual Fulfilled</th>
                          <th>Slippage</th>
                          <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {slippage.map((slip) => (
                          <tr key={slip.quotationId}>
                            <td>
                              <Link
                                to={`/quotations/${slip.quotationId}`}
                                style={{ fontWeight: 700, color: 'var(--color-primary-600)', textDecoration: 'none' }}
                              >
                                #{slip.quotationId.slice(-8).toUpperCase()}
                                <ArrowUpRight size={13} style={{ display: 'inline', marginLeft: 3 }} />
                              </Link>
                            </td>
                            <td style={{ fontWeight: 600 }}>{slip.customerName}</td>
                            <td>{slip.repName}</td>
                            <td className="df-text-muted">
                              {new Date(slip.promisedDeliveryDate).toLocaleDateString()}
                            </td>
                            <td>
                              {new Date(slip.actualFulfilledAt).toLocaleDateString()}
                            </td>
                            <td>
                              <Badge variant="danger" dot>
                                {slip.daysLate} day{slip.daysLate > 1 ? 's' : ''} late
                              </Badge>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <button
                                type="button"
                                className="df-btn df-btn-outline df-btn-sm"
                                disabled={escalatingId === slip.quotationId}
                                onClick={() => handleEscalate(slip.quotationId)}
                              >
                                <Flame size={13} color="var(--color-danger-500)" />
                                {escalatingId === slip.quotationId ? 'Escalating…' : 'Escalate'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            )}
          </>
        )}
      </div>
    </>
  );
}
