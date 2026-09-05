import React from 'react';
import { FileText, ShoppingBag, Clock, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import PortalStatCard from './PortalStatCard';
import PortalSectionHeader from './PortalSectionHeader';
import PortalEmptyState from './PortalEmptyState';
import ActivityTimeline from './ActivityTimeline';

/**
 * PortalOverview
 * 
 * The main landing view inside the Customer Portal.
 * 
 * KPI cards use no live data (portal quotation route not yet mounted
 * in server/src/index.js). Shows empty/loading states.
 * 
 * When backend routes are mounted:
 *   GET /api/portal/quotations  → populate quotation stats
 *   GET /api/portal/profile     → populate profile/tier data
 */
export default function PortalOverview({ onNavigate }) {
  const { customer } = useAuth();

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

      {/* Welcome Banner */}
      <div style={{
        backgroundColor: '#0d1324',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '12px',
        padding: '1.5rem 1.75rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        flexWrap: 'wrap',
      }}>
        <div>
          <p style={{ fontSize: '0.8125rem', color: '#475569', fontWeight: '500', marginBottom: '0.25rem' }}>
            {greeting()},
          </p>
          <h2 style={{
            fontSize: '1.375rem',
            fontWeight: '800',
            color: '#f1f5f9',
            letterSpacing: '-0.025em',
          }}>
            {customer?.name || 'Welcome back'}
          </h2>
          <p style={{ fontSize: '0.8125rem', color: '#334155', marginTop: '0.375rem' }}>
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
            border: '1px solid rgba(59,130,246,0.3)',
            backgroundColor: 'rgba(59,130,246,0.10)',
            color: '#60a5fa',
            fontSize: '0.8125rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 150ms ease',
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.backgroundColor = 'rgba(59,130,246,0.18)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.backgroundColor = 'rgba(59,130,246,0.10)';
          }}
        >
          <FileText size={14} />
          View Quotations
        </button>
      </div>

      {/* KPI Cards */}
      <div>
        <PortalSectionHeader title="Account Summary" />
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: '0.875rem',
        }}>
          {/* 
            These stat cards intentionally show empty/zero state.
            No backend endpoint is mounted yet.
            Wire to GET /api/portal/quotations when route is mounted.
          */}
          <PortalStatCard
            icon={FileText}
            label="Active Quotations"
            value="—"
            status="default"
            sub="API not yet connected"
          />
          <PortalStatCard
            icon={Clock}
            label="Pending Actions"
            value="—"
            status="warning"
            sub="API not yet connected"
          />
          <PortalStatCard
            icon={CheckCircle}
            label="Confirmed Orders"
            value="—"
            status="success"
            sub="API not yet connected"
          />
          <PortalStatCard
            icon={ShoppingBag}
            label="Fulfilled Orders"
            value="—"
            status="default"
            sub="API not yet connected"
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
          backgroundColor: '#0d1324',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: '12px',
          padding: '1.25rem',
        }}>
          <PortalSectionHeader title="Recent Activity" />
          <ActivityTimeline items={[]} loading={false} />
        </div>

        {/* Pending Actions */}
        <div style={{
          backgroundColor: '#0d1324',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: '12px',
          padding: '1.25rem',
        }}>
          <PortalSectionHeader title="Pending Actions" />
          <PortalEmptyState
            icon={CheckCircle}
            title="No pending actions"
            description="Quotations requiring your review or confirmation will appear here."
          />
        </div>
      </div>

    </div>
  );
}
