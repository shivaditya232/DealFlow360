import React from 'react';
import { Clock, CheckCircle, XCircle, AlertCircle, FileText, RotateCcw } from 'lucide-react';

/**
 * QuotationStatusBadge
 * Renders a status pill for a quotation.
 * Statuses from Prisma QuotationStatus enum:
 *   DRAFT | PENDING_APPROVAL | APPROVED | REJECTED | NEGOTIATING | CONFIRMED | FULFILLED | CANCELLED
 *
 * UI-merge fix: this used to be its own bespoke pill (hardcoded hex colors,
 * fixed regardless of light/dark theme). It now reuses the exact same
 * `.df-badge` / `.df-badge-*` classes (styles/app.css) that Dashboard,
 * QuotationDetail and ReportsPage already use for status pills elsewhere in
 * the app — same shape, same light/dark-mode-aware colors, just with an icon
 * added in front.
 */
const STATUS_CONFIG = {
  DRAFT:            { label: 'Draft',           variant: 'neutral', icon: FileText },
  PENDING_APPROVAL: { label: 'Pending Approval',variant: 'warning', icon: Clock },
  APPROVED:         { label: 'Approved',        variant: 'success', icon: CheckCircle },
  REJECTED:         { label: 'Rejected',        variant: 'danger',  icon: XCircle },
  NEGOTIATING:      { label: 'Negotiating',     variant: 'violet',  icon: RotateCcw },
  CONFIRMED:        { label: 'Confirmed',       variant: 'success', icon: CheckCircle },
  FULFILLED:        { label: 'Fulfilled',       variant: 'primary', icon: CheckCircle },
  CANCELLED:        { label: 'Cancelled',       variant: 'neutral', icon: AlertCircle },
};

export default function QuotationStatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG['DRAFT'];
  const Icon = config.icon;

  return (
    <span className={`df-badge df-badge-${config.variant}`}>
      <Icon size={11} strokeWidth={2.5} />
      {config.label}
    </span>
  );
}
