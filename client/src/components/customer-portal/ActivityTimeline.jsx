import React from 'react';
import { CheckCircle2, Clock, MessageSquare, RotateCcw } from 'lucide-react';

/**
 * ActivityTimeline
 *
 * Shows a chronological list of portal activity events.
 * items shape: [{ id, type, label, timestamp, meta }]
 * (PortalOverview synthesizes these from quotation status + timestamps —
 * see the comment there for why there's no dedicated audit-log endpoint yet.)
 */
const ACTIVITY_ICONS = {
  CONFIRMED:  { icon: CheckCircle2, color: '#10b981' },
  ACCEPTED:   { icon: CheckCircle2, color: '#3b82f6' },
  APPROVED:   { icon: CheckCircle2, color: '#3b82f6' },
  FULFILLED:  { icon: CheckCircle2, color: '#10b981' },
  REJECTED:   { icon: CheckCircle2, color: '#ef4444' },
  CANCELLED:  { icon: CheckCircle2, color: '#ef4444' },
  NEGOTIATING:{ icon: RotateCcw,    color: '#8b5cf6' },
  PENDING_APPROVAL: { icon: Clock,  color: '#f59e0b' },
  MESSAGE:    { icon: MessageSquare,color: 'var(--portal-text-3)' },
  default:    { icon: Clock,        color: 'var(--portal-text-4)'  },
};

function ActivityItem({ item, isLast }) {
  const { icon: Icon, color } = ACTIVITY_ICONS[item.type] || ACTIVITY_ICONS.default;

  return (
    <div style={{ display: 'flex', gap: '0.875rem', position: 'relative' }}>
      {/* Connector line */}
      {!isLast && (
        <div style={{
          position: 'absolute',
          left: '15px',
          top: '30px',
          bottom: '-12px',
          width: '1px',
          backgroundColor: 'var(--portal-border)',
        }} />
      )}

      {/* Icon */}
      <div style={{
        width: '30px',
        height: '30px',
        borderRadius: '50%',
        backgroundColor: `${color}18`,
        border: `1px solid ${color}30`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color,
        flexShrink: 0,
        zIndex: 1,
      }}>
        <Icon size={13} strokeWidth={2} />
      </div>

      {/* Content */}
      <div style={{ paddingBottom: isLast ? 0 : '1.25rem', flex: 1 }}>
        <p style={{ fontSize: '0.8125rem', color: 'var(--portal-text-1b)', fontWeight: '500', lineHeight: '1.4' }}>
          {item.label}
        </p>
        {item.meta && (
          <p style={{ fontSize: '0.75rem', color: 'var(--portal-text-3)', marginTop: '0.2rem' }}>
            {item.meta}
          </p>
        )}
        <p style={{ fontSize: '0.7rem', color: 'var(--portal-text-5)', marginTop: '0.3rem' }}>
          {item.timestamp
            ? new Date(item.timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
            : '—'}
        </p>
      </div>
    </div>
  );
}

function SkeletonRow() {
  return (
    <div style={{ display: 'flex', gap: '0.875rem', paddingBottom: '1.25rem' }}>
      <div style={{
        width: '30px', height: '30px', borderRadius: '50%',
        backgroundColor: 'var(--portal-chip-bg)', flexShrink: 0,
      }} />
      <div style={{ flex: 1, paddingTop: '4px' }}>
        <div style={{ height: '11px', width: '70%', borderRadius: '4px', backgroundColor: 'var(--portal-chip-bg)' }} />
        <div style={{ height: '9px', width: '40%', borderRadius: '4px', backgroundColor: 'var(--portal-chip-bg)', marginTop: '7px' }} />
      </div>
    </div>
  );
}

export default function ActivityTimeline({ items, loading = false }) {
  if (loading) {
    return (
      <div>
        {[1, 2, 3].map(i => <SkeletonRow key={i} />)}
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div style={{ padding: '1.5rem 0', textAlign: 'center' }}>
        <Clock size={20} color="var(--portal-text-5)" style={{ margin: '0 auto 0.5rem' }} />
        <p style={{ fontSize: '0.8rem', color: 'var(--portal-text-3)' }}>No recent activity</p>
      </div>
    );
  }

  return (
    <div>
      {items.map((item, index) => (
        <ActivityItem key={item.id || index} item={item} isLast={index === items.length - 1} />
      ))}
    </div>
  );
}
