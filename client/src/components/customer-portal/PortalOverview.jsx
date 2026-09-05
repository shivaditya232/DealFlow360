import React, { useEffect, useState } from 'react';
import { FileText, ShoppingBag, Clock, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import portalService from '../../services/portal.service';
import PortalStatCard from './PortalStatCard';
import PortalSectionHeader from './PortalSectionHeader';
import PortalEmptyState from './PortalEmptyState';
import ActivityTimeline from './ActivityTimeline';

/**
 * PortalOverview
 *
 * The main landing view inside the Customer Portal.
 *
 * KPI cards and activity are derived from GET /api/portal/quotations
 * (portal.routes.js — mounted, authenticate-only). There is no separate
 * activity-log endpoint yet, so "Recent Activity" is synthesized from each
 * quotation's own status + lastActivityAt, which is the same signal the
 * negotiation thread already uses elsewhere in the app.
 */

// Maps a quotation's status to a bucket used by the KPI cards below.
const ACTIVE_STATUSES = ['APPROVED', 'NEGOTIATING', 'PENDING_APPROVAL'];
const PENDING_STATUSES = ['NEGOTIATING', 'PENDING_APPROVAL'];

export default function PortalOverview({ onNavigate, onOpenQuotation }) {
  const { customer } = useAuth();
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    portalService.listQuotations()
      .then((data) => {
        if (!cancelled) {
          setQuotations(Array.isArray(data) ? data : []);
          setError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.response?.data?.error || err.friendlyMessage || 'Failed to load your account summary.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const activeCount = quotations.filter(q => ACTIVE_STATUSES.includes(q.status)).length;
  const pendingCount = quotations.filter(q => PENDING_STATUSES.includes(q.status)).length;
  const confirmedCount = quotations.filter(q => q.status === 'CONFIRMED').length;
  const fulfilledCount = quotations.filter(q => q.status === 'FULFILLED').length;

  const pendingQuotations = quotations.filter(q => PENDING_STATUSES.includes(q.status));

  // Synthesize a lightweight activity feed from quotation status + timestamps.
  const activityItems = [...quotations]
    .sort((a, b) => new Date(b.lastActivityAt || b.updatedAt) - new Date(a.lastActivityAt || a.updatedAt))
    .slice(0, 6)
    .map((q) => ({
      id: q.id,
      type: q.status,
      label: `Quotation #${q.id?.slice(-8)?.toUpperCase()} — ${statusLabel(q.status)}`,
      timestamp: q.lastActivityAt || q.updatedAt,
      meta: typeof q.orderTotal === 'number'
        ? `$${q.orderTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : undefined,
    }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

      {/* Welcome Banner */}
      <div style={{
        backgroundColor: 'var(--portal-surface)',
        border: '1px solid var(--portal-border)',
        borderRadius: '12px',
        padding: '1.5rem 1.75rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        flexWrap: 'wrap',
      }}>
        <div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--portal-text-4)', fontWeight: '500', marginBottom: '0.25rem' }}>
            {greeting()},
          </p>
          <h2 style={{
            fontSize: '1.375rem',
            fontWeight: '800',
            color: 'var(--portal-text-1)',
            letterSpacing: '-0.025em',
          }}>
            {customer?.name || 'Welcome back'}
          </h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--portal-text-5)', marginTop: '0.375rem' }}>
            Here's an overview of your account activity and open quotations.
          </p>
        </div>

        {/* Quick action to view quotations */}
        <button
          onClick={() => onNavigate('quotations')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            borderRadius: '8px',
            border: '1px solid var(--portal-accent-soft-border)',
            backgroundColor: 'var(--portal-accent-soft-bg)',
            color: 'var(--portal-accent-strong)',
            fontSize: '0.8125rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 150ms ease',
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.backgroundColor = 'var(--portal-accent-soft-bg-hover)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.backgroundColor = 'var(--portal-accent-soft-bg)';
          }}
        >
          <FileText size={14} />
          View Quotations
        </button>
      </div>

      {error && (
        <div style={{
          padding: '0.875rem 1rem',
          backgroundColor: 'rgba(239,68,68,0.08)',
          border: '1px solid rgba(239,68,68,0.22)',
          borderRadius: '9px',
          color: 'var(--color-danger-500)',
          fontSize: '0.8125rem',
        }}>
          {error}
        </div>
      )}

      {/* KPI Cards */}
      <div>
        <PortalSectionHeader title="Account Summary" />
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: '0.875rem',
        }}>
          <PortalStatCard
            icon={FileText}
            label="Active Quotations"
            value={loading ? '—' : String(activeCount)}
            status="default"
            loading={loading}
          />
          <PortalStatCard
            icon={Clock}
            label="Pending Actions"
            value={loading ? '—' : String(pendingCount)}
            status="warning"
            loading={loading}
          />
          <PortalStatCard
            icon={CheckCircle}
            label="Confirmed Orders"
            value={loading ? '—' : String(confirmedCount)}
            status="success"
            loading={loading}
          />
          <PortalStatCard
            icon={ShoppingBag}
            label="Fulfilled Orders"
            value={loading ? '—' : String(fulfilledCount)}
            status="default"
            loading={loading}
          />
        </div>
      </div>

      {/* Recent Activity + Pending Actions */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '1rem',
        alignItems: 'start',
      }}>
        {/* Recent Activity */}
        <div style={{
          backgroundColor: 'var(--portal-surface)',
          border: '1px solid var(--portal-border)',
          borderRadius: '12px',
          padding: '1.25rem',
        }}>
          <PortalSectionHeader title="Recent Activity" />
          <ActivityTimeline items={activityItems} loading={loading} />
        </div>

        {/* Pending Actions */}
        <div style={{
          backgroundColor: 'var(--portal-surface)',
          border: '1px solid var(--portal-border)',
          borderRadius: '12px',
          padding: '1.25rem',
        }}>
          <PortalSectionHeader title="Pending Actions" />
          {loading ? (
            <ActivityTimeline items={[]} loading={true} />
          ) : pendingQuotations.length === 0 ? (
            <PortalEmptyState
              icon={CheckCircle}
              title="No pending actions"
              description="Quotations requiring your review or confirmation will appear here."
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {pendingQuotations.slice(0, 5).map(q => (
                <button
                  key={q.id}
                  onClick={() => onOpenQuotation ? onOpenQuotation(q.id) : onNavigate('quotations')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.75rem',
                    padding: '0.75rem 0.875rem',
                    borderRadius: '8px',
                    border: '1px solid var(--portal-border)',
                    backgroundColor: 'transparent',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <span style={{ fontSize: '0.8125rem', color: 'var(--portal-text-1b)', fontWeight: '500' }}>
                    #{q.id?.slice(-8)?.toUpperCase()} — {statusLabel(q.status)}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--portal-accent-strong)', fontWeight: '600' }}>
                    Review →
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}

function statusLabel(status) {
  switch (status) {
    case 'APPROVED': return 'Approved';
    case 'NEGOTIATING': return 'Negotiating';
    case 'PENDING_APPROVAL': return 'Pending approval';
    case 'CONFIRMED': return 'Confirmed';
    case 'FULFILLED': return 'Fulfilled';
    case 'REJECTED': return 'Rejected';
    case 'CANCELLED': return 'Cancelled';
    default: return status || 'Updated';
  }
}
