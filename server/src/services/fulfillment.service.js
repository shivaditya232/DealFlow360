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
