import React from 'react';

/**
 * Minimal horizontal-bar chart for small category counts.
 * data: [{ label, value, color }]
 */
export default function BarChart({ data, height = 22 }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {data.map((d, i) => (
        <div key={i}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
            <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{d.label}</span>
            <span style={{ color: 'var(--text-muted)' }}>{d.value}</span>
          </div>
          <div style={{ height, borderRadius: 999, background: 'var(--chart-track)', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${(d.value / max) * 100}%`,
                minWidth: d.value > 0 ? 8 : 0,
                borderRadius: 999,
                background: d.color,
                transition: 'width 500ms ease',
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
