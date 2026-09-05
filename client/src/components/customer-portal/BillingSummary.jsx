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
          <AlertCircle size={16} color="#f59e0b" style={{ flexShrink: 0, marginTop: '1px' }} />
          <div>
            <p style={{ fontSize: '0.8125rem', fontWeight: '600', color: '#f59e0b', marginBottom: '0.2rem' }}>
              Billing portal coming soon
            </p>
            <p style={{ fontSize: '0.75rem', color: '#92400e' }}>
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
            backgroundColor: '#0d1324',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '8px',
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: 'rgba(255,255,255,0.04)',
              flexShrink: 0,
            }} />
            <div style={{ flex: 1 }}>
              <div style={{ height: '11px', width: `${40 + i * 15}%`, borderRadius: '4px', backgroundColor: 'rgba(255,255,255,0.05)' }} />
              <div style={{ height: '9px', width: '30%', borderRadius: '4px', backgroundColor: 'rgba(255,255,255,0.03)', marginTop: '7px' }} />
            </div>
            <div style={{ height: '11px', width: '60px', borderRadius: '4px', backgroundColor: 'rgba(255,255,255,0.04)' }} />
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
          backgroundColor: 'rgba(59,130,246,0.07)',
          border: '1px solid rgba(59,130,246,0.15)',
          borderRadius: '9px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CreditCard size={15} color="#3b82f6" />
            <span style={{ fontSize: '0.8rem', color: '#93c5fd', fontWeight: '500' }}>Next billing date</span>
          </div>
          <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#f1f5f9' }}>
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
          backgroundColor: '#0d1324',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: '8px',
        }}>
          <div>
            <div style={{ fontSize: '0.8125rem', color: '#cbd5e1', fontWeight: '500' }}>
              {invoice.type} · {new Date(invoice.dueDate).toLocaleDateString()}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: '0.2rem' }}>
              {invoice.paidAt ? 'Paid' : 'Unpaid'}
            </div>
          </div>
          <span style={{
            fontSize: '0.875rem',
            fontWeight: '700',
            color: invoice.paidAt ? '#10b981' : '#f59e0b',
          }}>
            ${Number(invoice.amount).toFixed(2)}
          </span>
        </div>
      ))}
    </div>
  );
}
