import React, { useId } from 'react';

/**
 * Minimal dependency-free donut chart.
 * data: [{ label, value, color }]
 */
export default function DonutChart({ data, size = 140, thickness = 16, centerLabel, centerValue }) {
  const uid = useId();
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--chart-track)"
          strokeWidth={thickness}
        />
        {data.map((d, i) => {
          const fraction = d.value / total;
          const dash = fraction * circumference;
          const el = (
            <circle
              key={`${uid}-${i}`}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={d.color}
              strokeWidth={thickness}
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={-offset}
              strokeLinecap="butt"
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
              style={{ transition: 'stroke-dasharray 500ms ease' }}
            />
          );
          offset += dash;
          return el;
        })}
      </svg>
      {(centerLabel || centerValue) && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {centerValue && <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{centerValue}</div>}
          {centerLabel && <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 3 }}>{centerLabel}</div>}
        </div>
      )}
    </div>
  );
}
