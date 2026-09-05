import React from 'react';

const DEFAULT_METRICS = [
  { value: '3×', label: 'Faster deal cycles' },
  { value: '40%', label: 'Higher win rates' },
  { value: '100%', label: 'End-to-end visibility' },
];

const PREVIEW_DEALS = [
  {
    company: 'Acme Corporation',
    product: 'Enterprise Platform',
    value: '$248,500',
    status: 'Approval Required',
    statusType: 'amber',
    progress: 82,
    stage: 'Stage 02 • Legal Review',
  },
  {
    company: 'Vertex Systems',
    product: 'Cloud Infrastructure',
    value: '$124,800',
    status: 'Approved',
    statusType: 'green',
    progress: 100,
    stage: 'Stage 04 • Fulfillment Ready',
  },
  {
    company: 'Northstar Labs',
    product: 'Analytics Suite',
    value: '$86,400',
    status: 'Negotiation',
    statusType: 'blue',
    progress: 68,
    stage: 'Stage 03 • Contract Redline',
  },
];

const PREVIEW_TELEMETRY = [
  {
    label: 'MARGIN HEALTH',
    value: 'Healthy',
    type: 'green',
  },
  {
    label: 'APPROVALS',
    value: '2 Pending',
    type: 'amber',
  },
  {
    label: 'REVENUE PIPELINE',
    value: '$1.2M',
    type: 'blue',
  },
];

export default function SignupBrandPanel({ metrics = DEFAULT_METRICS }) {
  return (
    <aside className="df-brand-panel df-signup-brand-panel" aria-label="DealFlow360 Product Overview">
      {/* Background Architectural Grid & Glow */}
      <div className="df-brand-bg-grid" aria-hidden="true" />
      <div className="df-brand-ambient-glow" aria-hidden="true" />
      
      <div className="df-brand-inner df-signup-brand-inner">
        {/* 1. BRAND HEADER */}
        <header className="df-brand-header-group df-signup-brand-header">
          <div className="df-brand-logo-lockup">
            <div className="df-brand-logo-mark" aria-hidden="true">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="#3B82F6" />
                <path d="M2 17L12 22L22 17" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M2 12L12 17L22 12" stroke="#93C5FD" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.75" />
              </svg>
            </div>
            <span className="df-brand-wordmark">DealFlow360</span>
          </div>
          <p className="df-brand-tagline-descriptor">
            SALES • OPERATIONS • REVENUE
          </p>
        </header>

        {/* 2. HERO SECTION */}
        <section className="df-brand-hero-section df-signup-hero-section">
          <h2 className="df-brand-headline">
            <span className="df-headline-row">Build better deals.</span>
            <span className="df-headline-row df-headline-accent">From first quote to revenue.</span>
          </h2>
          <p className="df-brand-support-text df-signup-support-text">
            Create your DealFlow360 account and bring quoting, approvals, negotiation, fulfillment, and billing into one operating platform.
          </p>
        </section>

        {/* 3. PREMIUM PRODUCT PREVIEW: Miniature DealFlow360 Platform Interface */}
        <section className="df-preview-container" aria-label="DealFlow360 Operating System Preview">
          {/* Top Window chrome / Title bar */}
          <div className="df-preview-header">
            <div className="df-preview-header-left">
              <div className="df-preview-window-dots" aria-hidden="true">
                <span className="df-pdot df-pdot-red" />
                <span className="df-pdot df-pdot-amber" />
                <span className="df-pdot df-pdot-green" />
              </div>
              <span className="df-preview-title">DEAL PIPELINE</span>
            </div>

            <div className="df-preview-live-badge">
              <span className="df-preview-live-pulse" aria-hidden="true" />
              <span>LIVE</span>
            </div>
          </div>

          {/* Subheader / Active Deals Count */}
          <div className="df-preview-subbar">
            <span className="df-preview-subbar-label">Active Deals</span>
            <span className="df-preview-subbar-tag">3 in flight</span>
          </div>

          {/* Deal Cards / Rows */}
          <div className="df-preview-deals-list">
            {PREVIEW_DEALS.map((deal) => (
              <div key={deal.company} className="df-preview-deal-card">
                {/* Primary Info Row */}
                <div className="df-preview-deal-top">
                  <div className="df-preview-deal-entity">
                    <span className="df-preview-company">{deal.company}</span>
                    <span className="df-preview-product">{deal.product}</span>
                  </div>

                  <div className="df-preview-deal-meta">
                    <span className="df-preview-value">{deal.value}</span>
                    <span className={`df-preview-status-badge df-status-${deal.statusType}`}>
                      <span className="df-status-dot" aria-hidden="true" />
                      {deal.status}
                    </span>
                  </div>
                </div>

                {/* Progress Bar & Stage Info */}
                <div className="df-preview-progress-block">
                  <div className="df-preview-progress-track" aria-hidden="true">
                    <div 
                      className={`df-preview-progress-fill df-progress-${deal.statusType}`} 
                      style={{ width: `${deal.progress}%` }}
                    />
                  </div>
                  <div className="df-preview-progress-labels">
                    <span className="df-preview-stage-text">{deal.stage}</span>
                    <span className="df-preview-percent">{deal.progress}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 4. COMPACT INTELLIGENCE STRIP */}
          <div className="df-preview-intel-strip" role="region" aria-label="Pipeline Intelligence Summary">
            {PREVIEW_TELEMETRY.map((item, idx) => (
              <React.Fragment key={item.label}>
                <div className="df-preview-intel-item">
                  <span className="df-preview-intel-label">{item.label}</span>
                  <div className={`df-preview-intel-val df-intel-val-${item.type}`}>
                    <span className="df-intel-signal-dot" aria-hidden="true" />
                    <span>{item.value}</span>
                  </div>
                </div>
                {idx < PREVIEW_TELEMETRY.length - 1 && (
                  <div className="df-preview-intel-divider" aria-hidden="true" />
                )}
              </React.Fragment>
            ))}
          </div>
        </section>

        {/* 5. BOTTOM METRICS (Horizontally aligned with subtle vertical separators) */}
        <footer className="df-brand-bottom-section df-signup-bottom-section">
          <div className="df-metrics-container" role="region" aria-label="Platform Value Indicators">
            <div className="df-metrics-header-caption">
              <span>INDICATIVE ENTERPRISE VALUE</span>
            </div>
            <div className="df-metrics-row">
              {metrics.map((metric, i) => (
                <React.Fragment key={i}>
                  <div className="df-metric-column">
                    <div className="df-metric-value-row">
                      <span className="df-metric-number">{metric.value}</span>
                      <span className="df-metric-arrow-up" aria-hidden="true" title="Projected improvement">↑</span>
                    </div>
                    <span className="df-metric-desc">{metric.label}</span>
                  </div>
                  {i < metrics.length - 1 && (
                    <div className="df-metric-divider" aria-hidden="true" />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* 6. BOTTOM BRANDING */}
          <div className="df-brand-footer-line">
            <span className="df-footer-tag">BUILT FOR MODERN B2B</span>
            <span className="df-footer-copyright">&copy; 2026 DealFlow360</span>
          </div>
        </footer>
      </div>
    </aside>
  );
}
