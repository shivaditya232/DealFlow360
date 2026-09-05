import React from 'react';
import { CreditCard } from 'lucide-react';
import PortalSectionHeader from './PortalSectionHeader';
import BillingSummary from './BillingSummary';

/**
 * PortalBilling
 * 
 * Billing section.
 * No backend billing endpoint currently exists.
 * 
 * Prisma models (for when endpoints are created):
 *   BillingEvent (INVOICE | REFUND | CREDIT_NOTE | PRORATION)
 *   Payment (amount, method, paidAt, daysLate)
 *   Subscription (status: ACTIVE | CANCELLED | EXPIRED, currentPeriodEnd, nextBillingDate)
 *   SubscriptionPlan (name, billingCycle: WEEKLY | MONTHLY | QUARTERLY | YEARLY)
 */
export default function PortalBilling() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <PortalSectionHeader
        title="Billing"
        subtitle="Invoices, payment history, and subscription management."
        icon={CreditCard}
      />
      <BillingSummary data={null} />
    </div>
  );
}
