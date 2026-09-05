import React from 'react';
import { Truck, Package, Clock } from 'lucide-react';

/**
 * OrderStatusCard
 * 
 * Displays order/fulfillment status. This is UI architecture only.
 * 
 * Backend: No orders/fulfillment endpoint is currently mounted.
 * When the endpoint exists, connect it here.
 * 
 * Fulfillment data would come from QuotationLine.fulfillmentSplits
 * and FulfillmentSplit.fulfilledAt / isBackorder.
 */
export default function OrderStatusCard({ order }) {
  if (!order) {
    return (
      <div style={{
        padding: '1rem 1.25rem',
        backgroundColor: '#0d1324',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: '10px',
        display: 'flex',
        alignItems: 'center',
        gap: '0.875rem',
      }}>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '8px',
          backgroundColor: 'rgba(59,130,246,0.10)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#3b82f6',
          flexShrink: 0,
        }}>
          <Truck size={17} strokeWidth={1.75} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ height: '12px', width: '40%', borderRadius: '4px', backgroundColor: 'rgba(255,255,255,0.06)' }} />
          <div style={{ height: '10px', width: '60%', borderRadius: '4px', backgroundColor: 'rgba(255,255,255,0.04)', marginTop: '8px' }} />
        </div>
      </div>
    );
  }

  const { quotationId, status, items, fulfilledAt, isBackorder } = order;

  const statusColor = isBackorder ? '#f59e0b' : fulfilledAt ? '#10b981' : '#3b82f6';
  const statusLabel = isBackorder ? 'Backordered' : fulfilledAt ? 'Delivered' : 'Processing';

  return (
    <div style={{
      padding: '1rem 1.25rem',
      backgroundColor: '#0d1324',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: '10px',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '0.875rem',
    }}>
      <div style={{
        width: '36px',
        height: '36px',
        borderRadius: '8px',
        backgroundColor: `${statusColor}15`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: statusColor,
        flexShrink: 0,
      }}>
        {fulfilledAt ? <Package size={17} strokeWidth={1.75} /> : <Clock size={17} strokeWidth={1.75} />}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
          <span style={{
            fontFamily: 'monospace',
            fontSize: '0.75rem',
            color: '#475569',
          }}>
            #{quotationId?.slice(-8)?.toUpperCase()}
          </span>
          <span style={{
            fontSize: '0.7375rem',
            fontWeight: '600',
            color: statusColor,
          }}>
            {statusLabel}
          </span>
        </div>
        {items != null && (
          <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.375rem' }}>
            {items} item{items !== 1 ? 's' : ''}
          </div>
        )}
        {fulfilledAt && (
          <div style={{ fontSize: '0.75rem', color: '#334155', marginTop: '0.25rem' }}>
            Delivered {new Date(fulfilledAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </div>
        )}
      </div>
    </div>
  );
}
