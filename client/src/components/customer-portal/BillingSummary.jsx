import React from 'react';
import { CreditCard, AlertCircle } from 'lucide-react';

/**
 * BillingSummary
 *
 * UI architecture for billing section.
 *
 * Backend: No billing endpoint is currently implemented.
 * Prisma models relevant when endpoint exists:
 *   BillingEvent (INVOICE | REFUND | CREDIT_NOTE | PRORATION)
 *   Payment (amount, method, paidAt, daysLate)
 *   Subscription (status, currentPeriodEnd, nextBillingDate)
 *
 * Do NOT invent an API call here. This renders an empty/coming-soon state.
 */
export default function BillingSummary({ data }) {
  if (!data) {
    // API endpoint not yet available — render informational empty state
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.875rem',
      }}>
        {/* Coming-soon banner */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.75rem',
          padding: '0.875rem 1rem',
          backgroundColor: 'rgba(245,158,11,0.08)',
          border: '1px solid rgba(245,158,11,0.18)',
          borderRadius: '9px',
        }}>
          <AlertCircle size={16} color="var(--color-warning-500)" style={{ flexShrink: 0, marginTop: '1px' }} />
          <div>
            <p style={{ fontSize: '0.8125rem', fontWeight: '600', color: 'var(--color-warning-500)', marginBottom: '0.2rem' }}>
              Billing portal coming soon
            </p>
            <p style={{ fontSize: '0.75rem', color: 'var(--portal-text-2)' }}>
              Invoices, payment history, and subscription management will appear here once the billing API is available.
            </p>
          </div>
        </div>

        {/* Skeleton rows */}
        {[1, 2, 3].map(i => (
          <div key={i} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.875rem 1rem',
            backgroundColor: 'var(--portal-surface)',
            border: '1px solid var(--portal-border)',
            borderRadius: '8px',
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: 'var(--portal-chip-bg)',
              flexShrink: 0,
            }} />
            <div style={{ flex: 1 }}>
              <div style={{ height: '11px', width: `${40 + i * 15}%`, borderRadius: '4px', backgroundColor: 'var(--portal-chip-bg)' }} />
              <div style={{ height: '9px', width: '30%', borderRadius: '4px', backgroundColor: 'var(--portal-chip-bg)', marginTop: '7px' }} />
            </div>
            <div style={{ height: '11px', width: '60px', borderRadius: '4px', backgroundColor: 'var(--portal-chip-bg)' }} />
          </div>
        ))}
      </div>
    );
  }

  // When data is present (future — when backend billing endpoint exists)
  const { invoices = [], nextBillingDate, amountDue } = data;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {nextBillingDate && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.875rem 1rem',
          backgroundColor: 'var(--portal-accent-soft-bg)',
          border: '1px solid var(--portal-accent-soft-border)',
          borderRadius: '9px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CreditCard size={15} color="var(--portal-accent)" />
            <span style={{ fontSize: '0.8rem', color: 'var(--portal-accent-strong)', fontWeight: '500' }}>Next billing date</span>
          </div>
          <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--portal-text-1)' }}>
            {new Date(nextBillingDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </div>
      )}

      {invoices.map(invoice => (
        <div key={invoice.id} style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.875rem 1rem',
          backgroundColor: 'var(--portal-surface)',
          border: '1px solid var(--portal-border)',
          borderRadius: '8px',
        }}>
          <div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--portal-text-1b)', fontWeight: '500' }}>
              {invoice.type} · {new Date(invoice.dueDate).toLocaleDateString()}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--portal-text-3)', marginTop: '0.2rem' }}>
              {invoice.paidAt ? 'Paid' : 'Unpaid'}
            </div>
          </div>
          <span style={{
            fontSize: '0.875rem',
            fontWeight: '700',
            color: invoice.paidAt ? 'var(--color-success-500)' : 'var(--color-warning-500)',
          }}>
            ${Number(invoice.amount).toFixed(2)}
          </span>
        </div>
      ))}
    </div>
  );
}
