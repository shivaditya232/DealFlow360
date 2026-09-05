import React from 'react';

/**
 * Semi-circular gauge used for the blended-risk-score badge on the
 * Approval Detail view — fraction is 0..1 of the way to the HIGH threshold.
 */
export default function RadialGauge({ fraction, color, size = 120, label, value }) {
  const clamped = Math.min(1, Math.max(0, fraction));
  const radius = size / 2 - 10;
  const circumference = Math.PI * radius;
  const dash = clamped * circumference;

  return (
    <div style={{ position: 'relative', width: size, height: size / 2 + 12 }}>
      <svg width={size} height={size / 2 + 12} viewBox={`0 0 ${size} ${size / 2 + 12}`}>
        <path
          d={`M 10 ${size / 2} A ${radius} ${radius} 0 0 1 ${size - 10} ${size / 2}`}
          fill="none"
          stroke="var(--chart-track)"
          strokeWidth={10}
          strokeLinecap="round"
        />
        <path
          d={`M 10 ${size / 2} A ${radius} ${radius} 0 0 1 ${size - 10} ${size / 2}`}
          fill="none"
          stroke={color}
          strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference - dash}`}
          style={{ transition: 'stroke-dasharray 500ms ease' }}
        />
      </svg>
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, textAlign: 'center' }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>{value}</div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{label}</div>
      </div>
    </div>
  );
}
