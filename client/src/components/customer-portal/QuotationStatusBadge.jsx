import React from 'react';
import { Clock, CheckCircle, XCircle, AlertCircle, FileText, RotateCcw } from 'lucide-react';

/**
 * QuotationStatusBadge
 * Renders a status pill for a quotation.
 * Statuses from Prisma QuotationStatus enum:
 *   DRAFT | PENDING_APPROVAL | APPROVED | REJECTED | NEGOTIATING | CONFIRMED | FULFILLED | CANCELLED
 */
const STATUS_CONFIG = {
  DRAFT:            { label: 'Draft',           color: '#64748b', bg: 'rgba(100,116,139,0.12)', icon: FileText },
  PENDING_APPROVAL: { label: 'Pending Approval',color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', icon: Clock },
  APPROVED:         { label: 'Approved',        color: '#10b981', bg: 'rgba(16,185,129,0.12)', icon: CheckCircle },
  REJECTED:         { label: 'Rejected',        color: '#ef4444', bg: 'rgba(239,68,68,0.12)', icon: XCircle },
  NEGOTIATING:      { label: 'Negotiating',     color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)', icon: RotateCcw },
  CONFIRMED:        { label: 'Confirmed',       color: '#10b981', bg: 'rgba(16,185,129,0.12)', icon: CheckCircle },
  FULFILLED:        { label: 'Fulfilled',       color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', icon: CheckCircle },
  CANCELLED:        { label: 'Cancelled',       color: '#64748b', bg: 'rgba(100,116,139,0.12)', icon: AlertCircle },
};

export default function QuotationStatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG['DRAFT'];
  const Icon = config.icon;

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.3rem',
      padding: '3px 9px 3px 7px',
      borderRadius: '9999px',
      backgroundColor: config.bg,
      color: config.color,
      fontSize: '0.75rem',
      fontWeight: '600',
      letterSpacing: '0.01em',
    }}>
      <Icon size={11} strokeWidth={2.5} />
      {config.label}
    </span>
  );
}
