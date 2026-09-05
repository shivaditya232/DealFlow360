import React from 'react';
import { ShoppingBag } from 'lucide-react';
import PortalSectionHeader from './PortalSectionHeader';
import PortalEmptyState from './PortalEmptyState';

/**
 * PortalOrders
 *
 * UI architecture for order/fulfillment tracking.
 * No backend endpoint currently exists for this.
 *
 * When an orders endpoint is created, this view should be wired to it.
 * Fulfillment data in Prisma:
 *   FulfillmentSplit (quotationLineId, warehouseId, quantityFulfilled, isBackorder, fulfilledAt)
 *   StockReservation (status: HELD | RELEASED | CONSUMED)
 */
export default function PortalOrders() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
      <PortalSectionHeader
        title="Orders"
        subtitle="Track delivery status and fulfillment history for your confirmed orders."
      />
      <div style={{
        backgroundColor: 'var(--portal-surface)',
        border: '1px solid var(--portal-border)',
        borderRadius: '12px',
        overflow: 'hidden',
      }}>
        <PortalEmptyState
          icon={ShoppingBag}
          title="Orders coming soon"
          description="Fulfillment tracking and delivery status for your confirmed orders will appear here once the orders API is available."
        />
      </div>
    </div>
  );
}
