import React from 'react';
import { 
  FileText, 
  ShieldCheck, 
  Truck, 
  Receipt,
  ArrowRight
} from 'lucide-react';

const DEFAULT_METRICS = [
  { value: '3×', label: 'Faster deal cycles' },
  { value: '40%', label: 'Higher win rates' },
  { value: '100%', label: 'End-to-end visibility' },
];

const LIFECYCLE_STAGES = [
  { 
    id: 'quotation', 
    number: '01', 
    label: 'Quotation', 
    icon: FileText,
    colorClass: 'df-stage-blue',
    status: 'Tiered Pricing'
  },
  { 
    id: 'approval', 
    number: '02', 
    label: 'Approval', 
    icon: ShieldCheck,
    colorClass: 'df-stage-green',
    status: 'Automated'
  },
  { 
    id: 'fulfillment', 
    number: '03', 
    label: 'Fulfillment', 
    icon: Truck,
    colorClass: 'df-stage-purple',
    status: 'Split Routing'
  },
  { 
    id: 'billing', 
    number: '04', 
    label: 'Billing', 
    icon: Receipt,
    colorClass: 'df-stage-coral',
    status: 'Hybrid Invoices'
  },
];

export default function LoginBrandPanel({ metrics = DEFAULT_METRICS }) {
  return (
    <aside className="df-brand-panel" aria-label="DealFlow360 Overview">
      {/* Background Architectural Grid Texture & Soft Ambient Glow */}
      <div className="df-brand-bg-grid" aria-hidden="true" />
      <div className="df-brand-ambient-glow" aria-hidden="true" />
      
      <div className="df-brand-inner">
        {/* Top Header: Logo + SALES • OPERATIONS • REVENUE */}
        <header className="df-brand-header-group">
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

        {/* Main Hero Area */}
        <section className="df-brand-hero-section">
          <h2 className="df-brand-headline">
            <span className="df-headline-row">From Quotes to</span>
            <span className="df-headline-row">Revenue.</span>
            <span className="df-headline-row df-headline-accent">Without Friction.</span>
          </h2>
          <p className="df-brand-support-text">
            DealFlow360 brings quotations, approvals, negotiation, fulfillment, and billing into one intelligent operating platform.
          </p>
        </section>

        {/* Quote-to-Cash Flow: Minimal Horizontal Architecture Workflow */}
        <section className="df-lifecycle-centerpiece" aria-label="Quote-to-cash system architecture">
          <div className="df-flow-kicker-row">
            <span className="df-flow-kicker">QUOTE-TO-CASH LIFECYCLE</span>
            <span className="df-flow-subtle-indicator">
              <span className="df-flow-pulse" />
              <span>SYNCHRONIZED PIPELINE</span>
            </span>
          </div>

          <div className="df-flow-track">
            {LIFECYCLE_STAGES.map((stage, idx) => {
              const StageIcon = stage.icon;
              const isLast = idx === LIFECYCLE_STAGES.length - 1;
              return (
                <React.Fragment key={stage.id}>
                  <div className={`df-flow-stage ${stage.colorClass}`}>
                    <div className="df-stage-node-pill">
                      <span className="df-stage-num">{stage.number}</span>
                      <StageIcon size={12} className="df-stage-icon" aria-hidden="true" />
                    </div>
                    <div className="df-stage-text-group">
                      <span className="df-stage-name">{stage.label}</span>
                      <span className="df-stage-status-tag">{stage.status}</span>
                    </div>
                  </div>

                  {!isLast && (
                    <div className="df-flow-line-wrap" aria-hidden="true">
                      <span className="df-flow-line" />
                      <ArrowRight size={11} className="df-flow-arrow" />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </section>

        {/* Bottom Section: Performance Metrics with subtle green arrows and vertical dividers */}
        <footer className="df-brand-bottom-section">
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

          {/* Bottom Branding: Subtle & Minimal */}
          <div className="df-brand-footer-line">
            <span className="df-footer-tag">BUILT FOR MODERN B2B</span>
            <span className="df-footer-copyright">&copy; 2026 DealFlow360</span>
          </div>
        </footer>
      </div>
    </aside>
  );
}
