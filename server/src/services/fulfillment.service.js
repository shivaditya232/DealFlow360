import prisma from "../config/prisma.js";
import { logAction } from "./audit.service.js";
import { broadcast } from "../sockets/index.js";

// ── Billing cycle helpers ──────────────────────────────────────────────────────

const BILLING_CYCLE_DAYS = {
  WEEKLY: 7,
  MONTHLY: 30,
  QUARTERLY: 90,
  YEARLY: 365,
};

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

// ── Fulfillment trigger ────────────────────────────────────────────────────────

/**
 * Called the moment a Quotation transitions to CONFIRMED.
 * For each QuotationLine, runs the warehouse split algorithm and creates
 * FulfillmentSplit rows, consuming StockReservations.
 *
 * If total available stock is less than the line quantity, the covered
 * portion is fulfilled normally and one extra FulfillmentSplit with
 * isBackorder=true is created for the shortfall.
 *
 * @param {string} companyId
 * @param {string} quotationId
 */
export async function triggerFulfillment(companyId, quotationId) {
  const quotation = await prisma.quotation.findFirst({
    where: { id: quotationId, companyId },
    include: {
      lines: {
        include: {
          stockReservations: { where: { status: "HELD" } },
        },
      },
    },
  });

  if (!quotation) return;

  let anyBackorder = false;

  for (const line of quotation.lines) {
    await fulfillLine(companyId, quotationId, line);
    // Re-fetch to check if a backorder split was created
    const splits = await prisma.fulfillmentSplit.findMany({
      where: { quotationLineId: line.id },
    });
    if (splits.some((s) => s.isBackorder && s.fulfilledAt === null)) {
      anyBackorder = true;
    }
  }

  if (anyBackorder) {
    await logAction({
      companyId,
      userId: null,
      entityType: "Quotation",
      entityId: quotationId,
      action: "BACKORDER_CREATED",
      metadata: { reason: "Insufficient stock at time of confirmation" },
    });
    broadcast(quotationId, { event: "BACKORDER_CREATED", quotationId });
  }
}

/**
 * Runs the warehouse split algorithm for a single QuotationLine.
 * Minimise shipment count first, shippingCostWeight as tiebreaker.
 */
async function fulfillLine(companyId, quotationId, line) {
  const needed = line.quantity;

  // Fetch all stock levels for this product in this company, with sellable qty
  const stockLevels = await prisma.stockLevel.findMany({
    where: { productId: line.productId, companyId },
    include: { warehouse: true },
  });

  // Compute sellable qty per warehouse
  const available = stockLevels
    .map((sl) => ({
      stockLevelId: sl.id,
      warehouseId: sl.warehouseId,
      shippingCostWeight: Number(sl.warehouse.shippingCostWeight),
      sellable: sl.quantityAvailable - sl.quantityReserved,
    }))
    .filter((sl) => sl.sellable > 0);

  const totalAvailable = available.reduce((sum, sl) => sum + sl.sellable, 0);

  // ── Step 1: single-warehouse fulfillment ──────────────────────────────────
  const capable = available.filter((sl) => sl.sellable >= needed);
  let splits = []; // { stockLevelId, warehouseId, qty, isBackorder }

  if (capable.length > 0) {
    // Pick the one with lowest shippingCostWeight
    capable.sort((a, b) => a.shippingCostWeight - b.shippingCostWeight);
    const chosen = capable[0];
    splits = [{ ...chosen, qty: needed, isBackorder: false }];
  } else if (totalAvailable >= needed) {
    // ── Step 2: multi-warehouse split, fewest warehouses first ───────────────
    // Sort descending by sellable qty (largest first = fewest warehouses)
    const sorted = [...available].sort((a, b) => b.sellable - a.sellable);
    let remaining = needed;
    for (const wh of sorted) {
      if (remaining <= 0) break;
      const take = Math.min(wh.sellable, remaining);
      splits.push({ ...wh, qty: take, isBackorder: false });
      remaining -= take;
    }
  } else {
    // ── Partial fulfillment + backorder ───────────────────────────────────────
    const sorted = [...available].sort((a, b) => b.sellable - a.sellable);
    let remaining = needed;
    for (const wh of sorted) {
      if (remaining <= 0) break;
      const take = Math.min(wh.sellable, remaining);
      splits.push({ ...wh, qty: take, isBackorder: false });
      remaining -= take;
    }
    // Backorder split — use the warehouse/stockLevel with most stock as placeholder FK
    const backorderAnchor =
      available.length > 0
        ? available.sort((a, b) => b.sellable - a.sellable)[0]
        : stockLevels.length > 0
        ? {
            stockLevelId: stockLevels[0].id,
            warehouseId: stockLevels[0].warehouseId,
          }
        : null;

    if (backorderAnchor && remaining > 0) {
      splits.push({
        stockLevelId: backorderAnchor.stockLevelId,
        warehouseId: backorderAnchor.warehouseId,
        qty: remaining,
        isBackorder: true,
      });
    }
  }

  // ── Persist splits + consume reservations + decrement stock ───────────────
  await prisma.$transaction(async (tx) => {
    const now = new Date();

    for (const split of splits) {
      await tx.fulfillmentSplit.create({
        data: {
          quotationLineId: line.id,
          warehouseId: split.warehouseId,
          stockLevelId: split.stockLevelId,
          quantityFulfilled: split.qty,
          isBackorder: split.isBackorder,
          fulfilledAt: split.isBackorder ? null : now,
        },
      });

      if (!split.isBackorder) {
        // Decrement both quantityAvailable and quantityReserved
        await tx.stockLevel.update({
          where: { id: split.stockLevelId },
          data: {
            quantityAvailable: { decrement: split.qty },
            quantityReserved: { decrement: split.qty },
          },
        });
      }
    }

    // Consume all HELD reservations for this line
    await tx.stockReservation.updateMany({
      where: { quotationLineId: line.id, status: "HELD" },
      data: { status: "CONSUMED" },
    });
  });
}

// ── Billing trigger ────────────────────────────────────────────────────────────

/**
 * Called the moment a Quotation transitions to CONFIRMED (same call site as
 * triggerFulfillment). Creates BillingEvent rows for each line:
 *  - ONE_TIME  → stub Subscription + INVOICE BillingEvent (dueDate = +14 days)
 *  - RECURRING → active Subscription from SubscriptionPlan + first INVOICE
 *
 * Does NOT create Payment records — those are created by a separate payment
 * webhook/manual flow when money actually moves.
 *
 * @param {string} companyId
 * @param {string} quotationId
 */
export async function triggerBilling(companyId, quotationId) {
  const lines = await prisma.quotationLine.findMany({
    where: { quotationId },
    include: {
      product: {
        include: {
          // Not limited to take: 1 anymore — a RECURRING line now carries its
          // own billingCycle/customTenureMonths choice (set at Add Product
          // time), so we need every plan on the product to find or create
          // the one matching that specific cycle, not just the first one.
          subscriptionPlans: {
            where: { companyId },
          },
        },
      },
    },
  });

  const now = new Date();
  const dueDate14d = addDays(now, 14);

  for (const line of lines) {
    const lineTotal =
      Number(line.quantity) *
      Number(line.unitPrice) *
      (1 - Number(line.discountPercent) / 100);

    // Skip if a subscription already exists for this line (idempotency guard)
    const existingSub = await prisma.subscription.findUnique({
      where: { quotationLineId: line.id },
    });
    if (existingSub) continue;

    if (line.lineType === "ONE_TIME") {
      // For ONE_TIME lines, find or create a one-time stub SubscriptionPlan
      // (BillingEvent requires subscriptionId — schema constraint)
      let stubPlan = await prisma.subscriptionPlan.findFirst({
        where: { companyId, name: "__ONE_TIME_STUB__" },
      });
      if (!stubPlan) {
        stubPlan = await prisma.subscriptionPlan.create({
          data: {
            companyId,
            productId: line.productId,
            name: "__ONE_TIME_STUB__",
            billingCycle: "MONTHLY",
            prorationRule: "NO_PRORATION",
            cancellationRefundRule: "NO_REFUND",
          },
        });
      }

      const sub = await prisma.subscription.create({
        data: {
          quotationLineId: line.id,
          planId: stubPlan.id,
          status: "ACTIVE",
          currentPeriodEnd: dueDate14d,
          nextBillingDate: dueDate14d,
        },
      });

      await prisma.billingEvent.create({
        data: {
          subscriptionId: sub.id,
          type: "INVOICE",
          amount: lineTotal,
          dueDate: dueDate14d,
        },
      });

      await logAction({
        companyId,
        entityType: "BillingEvent",
        entityId: sub.id,
        action: "INVOICE_CREATED",
        metadata: { quotationId, lineId: line.id, lineType: "ONE_TIME", amount: lineTotal },
      });
    } else {
      // RECURRING — resolve the SubscriptionPlan from the billing cycle /
      // custom tenure the rep chose for THIS line (AddLineModal), not just
      // whichever plan happened to be configured first for the product.
      // Older lines created before that field existed have neither set —
      // fall back to the previous behavior (product's first plan) so
      // quotations already in flight keep working.
      let plan = null;
      let cycleDays = 30;

      if (line.customTenureMonths) {
        cycleDays = line.customTenureMonths * 30;
        const planName = `Custom (${line.customTenureMonths} mo)`;
        plan = line.product.subscriptionPlans.find((p) => p.name === planName);
        if (!plan) {
          plan = await prisma.subscriptionPlan.create({
            data: {
              companyId,
              productId: line.productId,
              name: planName,
              billingCycle: "MONTHLY", // nearest fit for display only — cycleDays above is what actually drives billing
              prorationRule: "DAILY_RATE",
              cancellationRefundRule: "PRORATED",
            },
          });
        }
      } else if (line.billingCycle) {
        plan = line.product.subscriptionPlans.find((p) => p.billingCycle === line.billingCycle);
        if (!plan) {
          plan = await prisma.subscriptionPlan.create({
            data: {
              companyId,
              productId: line.productId,
              name: `${line.product.name} — ${line.billingCycle}`,
              billingCycle: line.billingCycle,
              prorationRule: "DAILY_RATE",
              cancellationRefundRule: "PRORATED",
            },
          });
        }
        cycleDays = BILLING_CYCLE_DAYS[plan.billingCycle] ?? 30;
      } else {
        plan = line.product.subscriptionPlans[0];
        if (plan) cycleDays = BILLING_CYCLE_DAYS[plan.billingCycle] ?? 30;
      }

      if (!plan) {
        // No plan configured — skip with a warning log
        await logAction({
          companyId,
          entityType: "QuotationLine",
          entityId: line.id,
          action: "BILLING_SKIPPED",
          metadata: { reason: "No SubscriptionPlan found for recurring line", quotationId },
        });
        continue;
      }

      const periodEnd = addDays(now, cycleDays);

      const sub = await prisma.subscription.create({
        data: {
          quotationLineId: line.id,
          planId: plan.id,
          status: "ACTIVE",
          currentPeriodEnd: periodEnd,
          nextBillingDate: periodEnd,
        },
      });

      await prisma.billingEvent.create({
        data: {
          subscriptionId: sub.id,
          type: "INVOICE",
          amount: lineTotal,
          dueDate: periodEnd,
        },
      });

      await logAction({
        companyId,
        entityType: "BillingEvent",
        entityId: sub.id,
        action: "INVOICE_CREATED",
        metadata: { quotationId, lineId: line.id, lineType: "RECURRING", amount: lineTotal, planId: plan.id },
      });
    }
  }
}

// ── Subscription Proration & Cancellation Refunds ───────────────────────────

/**
 * Applies proration adjustments when an ACTIVE Subscription's quantity changes mid-cycle.
 * Called from executeAcceptFlow() in portal.service.js when an accepted proposal updates
 * quantity on a QuotationLine.
 *
 * @param {string} subscriptionId
 * @param {number} oldQuantity
 * @param {number} newQuantity
 * @param {Date} [changeDate=new Date()]
 * @param {object} [tx=null] Optional existing Prisma transaction client
 */
export async function applyProration(subscriptionId, oldQuantity, newQuantity, changeDate = new Date(), tx = null) {
  const client = tx || prisma;
  const numOldQty = Number(oldQuantity);
  const numNewQty = Number(newQuantity);

  if (numOldQty === numNewQty) return null;

  const subscription = await client.subscription.findUnique({
    where: { id: subscriptionId },
    include: {
      plan: true,
      quotationLine: {
        include: {
          quotation: { select: { id: true, companyId: true } },
        },
      },
    },
  });

  if (!subscription || subscription.status !== "ACTIVE") {
    return null;
  }

  const companyId = subscription.plan.companyId || subscription.quotationLine.quotation.companyId;
  const plan = subscription.plan;
  const rule = plan.prorationRule;

  const unitPrice = Number(subscription.quotationLine.unitPrice);
  const discountPercent = Number(subscription.quotationLine.discountPercent);
  const effectiveUnitPrice = unitPrice * (1 - discountPercent / 100);
  const qtyDelta = numNewQty - numOldQty;

  const runLogic = async (currentTx) => {
    if (rule === "NO_PRORATION") {
      // NO_PRORATION: No immediate adjustment; new quantity applies starting next billing cycle.
      await currentTx.auditLog.create({
        data: {
          companyId,
          userId: null,
          entityType: "Subscription",
          entityId: subscriptionId,
          action: "PRORATION_SKIPPED",
          metadata: {
            rule: "NO_PRORATION",
            reason: "Adjustment deferred to next natural billing cycle per plan rule",
            subscriptionId,
            oldQuantity: numOldQty,
            newQuantity: numNewQty,
          },
        },
      });
      return { rule: "NO_PRORATION", amount: 0, billingEvent: null };
    }

    let prorationAmount = 0;
    let daysRemaining = null;
    let totalDaysInPeriod = null;

    if (rule === "FULL_PERIOD") {
      // FULL_PERIOD: Billed as if applied for the entire current period
      prorationAmount = Math.round(qtyDelta * effectiveUnitPrice * 100) / 100;
    } else if (rule === "DAILY_RATE") {
      // DAILY_RATE: Prorated based on days remaining in the current billing period
      totalDaysInPeriod = BILLING_CYCLE_DAYS[plan.billingCycle] ?? 30;
      const diffMs = new Date(subscription.currentPeriodEnd).getTime() - new Date(changeDate).getTime();
      daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
      const dailyRate = effectiveUnitPrice / totalDaysInPeriod;
      prorationAmount = Math.round(dailyRate * qtyDelta * daysRemaining * 100) / 100;
    }

    if (prorationAmount === 0) {
      return { rule, amount: 0, billingEvent: null };
    }

    const billingEvent = await currentTx.billingEvent.create({
      data: {
        subscriptionId,
        type: "PRORATION",
        amount: prorationAmount,
        dueDate: changeDate,
      },
    });

    await currentTx.auditLog.create({
      data: {
        companyId,
        userId: null,
        entityType: "BillingEvent",
        entityId: billingEvent.id,
        action: "PRORATION_CREATED",
        metadata: {
          subscriptionId,
          rule,
          oldQuantity: numOldQty,
          newQuantity: numNewQty,
          qtyDelta,
          daysRemaining,
          totalDaysInPeriod,
          amount: prorationAmount,
          dueDate: changeDate,
        },
      },
    });

    return { rule, amount: prorationAmount, daysRemaining, billingEvent };
  };

  if (tx) {
    return runLogic(tx);
  } else {
    return prisma.$transaction(async (newTx) => runLogic(newTx));
  }
}

/**
 * Handles cancellation proration/refund when a Subscription moves to CANCELLED mid-cycle.
 * Applies SubscriptionPlan.cancellationRefundRule (NO_REFUND, PRORATED, FULL_PERIOD_REFUND).
 *
 * @param {string} subscriptionId
 * @param {Date} [cancelDate=new Date()]
 * @param {object} [tx=null] Optional existing Prisma transaction client
 */
export async function applyCancellationRefund(subscriptionId, cancelDate = new Date(), tx = null) {
  const client = tx || prisma;

  const subscription = await client.subscription.findUnique({
    where: { id: subscriptionId },
    include: {
      plan: true,
      quotationLine: {
        include: {
          quotation: { select: { id: true, companyId: true } },
        },
      },
    },
  });

  if (!subscription || subscription.status === "CANCELLED") {
    return null;
  }

  const companyId = subscription.plan.companyId || subscription.quotationLine.quotation.companyId;
  const plan = subscription.plan;
  const rule = plan.cancellationRefundRule;

  const unitPrice = Number(subscription.quotationLine.unitPrice);
  const discountPercent = Number(subscription.quotationLine.discountPercent);
  const effectiveUnitPrice = unitPrice * (1 - discountPercent / 100);
  const quantity = Number(subscription.quotationLine.quantity);
  const fullPeriodAmount = Math.round(quantity * effectiveUnitPrice * 100) / 100;

  const runLogic = async (currentTx) => {
    // 1. Mark subscription CANCELLED
    await currentTx.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: "CANCELLED",
        cancelledAt: cancelDate,
      },
    });

    let refundAmount = 0;
    let daysRemaining = null;
    let totalDaysInPeriod = null;

    if (rule === "FULL_PERIOD_REFUND") {
      refundAmount = fullPeriodAmount;
    } else if (rule === "PRORATED") {
      totalDaysInPeriod = BILLING_CYCLE_DAYS[plan.billingCycle] ?? 30;
      const diffMs = new Date(subscription.currentPeriodEnd).getTime() - new Date(cancelDate).getTime();
      daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
      const dailyRate = effectiveUnitPrice / totalDaysInPeriod;
      refundAmount = Math.round(dailyRate * quantity * daysRemaining * 100) / 100;
    }
    // NO_REFUND leaves refundAmount = 0

    let billingEvent = null;
    if (refundAmount > 0) {
      billingEvent = await currentTx.billingEvent.create({
        data: {
          subscriptionId,
          type: "REFUND",
          amount: refundAmount,
          dueDate: cancelDate,
        },
      });

      await currentTx.auditLog.create({
        data: {
          companyId,
          userId: null,
          entityType: "BillingEvent",
          entityId: billingEvent.id,
          action: "REFUND_CREATED",
          metadata: {
            subscriptionId,
            rule,
            quantity,
            refundAmount,
            daysRemaining,
            totalDaysInPeriod,
            dueDate: cancelDate,
          },
        },
      });
    }

    await currentTx.auditLog.create({
      data: {
        companyId,
        userId: null,
        entityType: "Subscription",
        entityId: subscriptionId,
        action: "SUBSCRIPTION_CANCELLED",
        metadata: {
          subscriptionId,
          rule,
          refundAmount,
          cancelDate,
        },
      },
    });

    return { subscriptionId, status: "CANCELLED", rule, refundAmount, billingEvent };
  };

  if (tx) {
    return runLogic(tx);
  } else {
    return prisma.$transaction(async (newTx) => runLogic(newTx));
  }
}

