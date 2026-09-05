import React, { useEffect, useState, useCallback } from 'react';
import { CreditCard, Receipt, Calendar, RefreshCw, CheckCircle2, Clock, AlertCircle, Zap } from 'lucide-react';
import portalService from '../../services/portal.service';
import PortalSectionHeader from './PortalSectionHeader';
import PortalEmptyState from './PortalEmptyState';
import Badge from '../ui/Badge';

export default function PortalBilling() {
  const [billingData, setBillingData] = useState({ oneTimeInvoices: [], recurringSubscriptions: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadBilling = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await portalService.getBilling();
      setBillingData(data || { oneTimeInvoices: [], recurringSubscriptions: [] });
    } catch (err) {
      setError(err.response?.data?.error || err.friendlyMessage || 'Failed to load billing events.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBilling();
  }, [loadBilling]);

  const { oneTimeInvoices, recurringSubscriptions } = billingData;
  const totalInvoices = oneTimeInvoices.length + recurringSubscriptions.reduce((acc, sub) => acc + (sub.events?.length || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      <PortalSectionHeader
        title="Invoices & Subscriptions"
        subtitle="Manage your one-time invoices and recurring subscription billing schedules."
        action={
          <button
            onClick={loadBilling}
            title="Refresh"
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              padding: '0.4rem 0.75rem',
              borderRadius: '7px',
              border: '1px solid var(--portal-border-strong)',
              backgroundColor: 'transparent',
              color: 'var(--portal-text-2)',
              fontSize: '0.75rem',
              fontWeight: '600',
              cursor: loading ? 'default' : 'pointer',
              opacity: loading ? 0.6 : 1,
            }}
          >
            <RefreshCw size={13} style={loading ? { animation: 'spin 1s linear infinite' } : undefined} /> Refresh
          </button>
        }
      />

      {error && (
        <div style={{
          padding: '0.875rem 1rem',
          backgroundColor: 'rgba(239,68,68,0.08)',
          border: '1px solid rgba(239,68,68,0.22)',
          borderRadius: '9px',
          color: 'var(--color-danger-500)',
          fontSize: '0.8125rem',
        }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{
              height: '84px',
              borderRadius: '10px',
              border: '1px solid var(--portal-border)',
              backgroundColor: 'var(--portal-chip-bg)',
              animation: 'pulse 1.5s ease-in-out infinite',
            }} />
          ))}
        </div>
      ) : totalInvoices === 0 && recurringSubscriptions.length === 0 ? (
        <div style={{
          backgroundColor: 'var(--portal-surface)',
          border: '1px solid var(--portal-border)',
          borderRadius: '12px',
          overflow: 'hidden',
        }}>
          <PortalEmptyState
            icon={CreditCard}
            title="No billing records found"
            description="Invoices and recurring subscriptions will automatically generate once your quotations are confirmed."
          />
        </div>
      ) : (
        <>
          {/* SECTION 1: RECURRING SUBSCRIPTIONS */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Zap size={18} color="var(--color-primary-500)" />
              <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                Active Subscriptions ({recurringSubscriptions.length})
              </h3>
            </div>

            {recurringSubscriptions.length === 0 ? (
              <div style={{
                padding: '1.25rem',
                backgroundColor: 'var(--portal-surface)',
                border: '1px solid var(--portal-border)',
                borderRadius: '10px',
                color: 'var(--text-muted)',
                fontSize: '0.875rem'
              }}>
                No active recurring subscriptions found.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                {recurringSubscriptions.map((sub) => (
                  <div key={sub.id} style={{
                    backgroundColor: 'var(--portal-surface)',
                    border: '1px solid var(--portal-border)',
                    borderRadius: '12px',
                    padding: '1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.875rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontWeight: '700', fontSize: '1rem', color: 'var(--text-primary)' }}>
                          {sub.productName}
                        </div>
                        <div className="df-text-sm df-text-muted">
                          Plan: {sub.planName} · {sub.billingCycle}
                        </div>
                      </div>
                      <Badge variant={sub.status === 'ACTIVE' ? 'success' : 'neutral'} dot>
                        {sub.status}
                      </Badge>
                    </div>

                    <div style={{
                      padding: '0.75rem',
                      borderRadius: '8px',
                      backgroundColor: 'var(--bg-app)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <span className="df-text-sm df-text-muted">Subscription Total:</span>
                      <span style={{ fontWeight: '800', fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                        ${sub.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <div>Next Billing: <strong style={{ color: 'var(--text-primary)' }}>{new Date(sub.nextBillingDate).toLocaleDateString()}</strong></div>
                      <div>Period End: {new Date(sub.currentPeriodEnd).toLocaleDateString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SECTION 2: ONE-TIME INVOICES */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Receipt size={18} color="var(--color-primary-500)" />
              <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                One-Time Invoices ({oneTimeInvoices.length})
              </h3>
            </div>

            {oneTimeInvoices.length === 0 ? (
              <div style={{
                padding: '1.25rem',
                backgroundColor: 'var(--portal-surface)',
                border: '1px solid var(--portal-border)',
                borderRadius: '10px',
                color: 'var(--text-muted)',
                fontSize: '0.875rem'
              }}>
                No one-time invoices issued yet.
              </div>
            ) : (
              <div style={{
                backgroundColor: 'var(--portal-surface)',
                border: '1px solid var(--portal-border)',
                borderRadius: '12px',
                overflow: 'hidden',
              }}>
                <div className="df-table-wrap">
                  <table className="df-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th>Invoice / Product</th>
                        <th>Amount</th>
                        <th>Due Date</th>
                        <th>Status</th>
                        <th>Quotation</th>
                      </tr>
                    </thead>
                    <tbody>
                      {oneTimeInvoices.map((inv) => {
                        const isPaid = inv.status === 'PAID';
                        const isOverdue = inv.status === 'OVERDUE';
                        return (
                          <tr key={inv.id} style={{ cursor: 'default' }}>
                            <td>
                              <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                                {inv.productName}
                              </div>
                              <div className="df-text-sm df-text-muted">
                                Invoice #{inv.id.slice(-8).toUpperCase()}
                              </div>
                            </td>
                            <td>
                              <span style={{ fontWeight: '700', fontSize: '1rem' }}>
                                ${inv.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </span>
                            </td>
                            <td className="df-text-muted">
                              {new Date(inv.dueDate).toLocaleDateString()}
                            </td>
                            <td>
                              <Badge
                                variant={isPaid ? 'success' : isOverdue ? 'danger' : 'warning'}
                                dot
                              >
                                {inv.status}
                              </Badge>
                            </td>
                            <td>
                              <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                                #{inv.quotationId.slice(-8).toUpperCase()}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
