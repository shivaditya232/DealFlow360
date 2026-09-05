import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

/**
 * PortalStatCard
 * Displays a single KPI metric card in the portal overview.
 * trend: 'up' | 'down' | 'neutral' — visual direction indicator.
 * status: 'default' | 'success' | 'warning' | 'danger'
 */
export default function PortalStatCard({
  icon: Icon,
  label,
  value,
  sub,
  trend,
  status = 'default',
  loading = false,
}) {
  const accentColor = {
    default: '#3b82f6',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
  }[status];

  const bgColor = {
    default: 'rgba(59,130,246,0.10)',
    success: 'rgba(16,185,129,0.10)',
    warning: 'rgba(245,158,11,0.10)',
    danger: 'rgba(239,68,68,0.10)',
  }[status];

  const borderColor = {
    default: 'rgba(59,130,246,0.18)',
    success: 'rgba(16,185,129,0.18)',
    warning: 'rgba(245,158,11,0.18)',
    danger: 'rgba(239,68,68,0.18)',
  }[status];

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? '#10b981' : trend === 'down' ? '#ef4444' : '#64748b';

  return (
    <div style={{
      backgroundColor: '#0d1324',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: '12px',
      padding: '1.25rem 1.375rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
      transition: 'border-color 200ms ease',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Subtle left accent bar */}
      <div style={{
        position: 'absolute',
        left: 0,
        top: '20%',
        bottom: '20%',
        width: '3px',
        borderRadius: '0 3px 3px 0',
        backgroundColor: accentColor,
        opacity: 0.7,
      }} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Icon */}
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '9px',
          backgroundColor: bgColor,
          border: `1px solid ${borderColor}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: accentColor,
          flexShrink: 0,
        }}>
          {Icon && <Icon size={17} strokeWidth={2} />}
        </div>

        {/* Trend indicator */}
        {trend && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            color: trendColor,
            fontSize: '0.75rem',
            fontWeight: '600',
          }}>
            <TrendIcon size={13} />
          </div>
        )}
      </div>

      {/* Value */}
      {loading ? (
        <div style={{
          height: '28px',
          borderRadius: '6px',
          backgroundColor: 'rgba(255,255,255,0.05)',
          width: '60%',
          animation: 'pulse 1.5s ease-in-out infinite',
        }} />
      ) : (
        <div>
          <div style={{
            fontSize: '1.625rem',
            fontWeight: '700',
            color: '#f1f5f9',
            letterSpacing: '-0.03em',
            lineHeight: '1',
            marginBottom: '0.375rem',
          }}>
            {value}
          </div>
          <div style={{
            fontSize: '0.8rem',
            color: '#64748b',
            fontWeight: '500',
            letterSpacing: '0.01em',
          }}>
            {label}
          </div>
          {sub && (
            <div style={{
              marginTop: '0.375rem',
              fontSize: '0.75rem',
              color: '#334155',
            }}>
              {sub}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
