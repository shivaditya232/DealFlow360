import prisma from "../config/prisma.js";
import { logAction } from "./audit.service.js";
import { broadcast } from "../sockets/index.js";

/**
 * Adds stock to a warehouse+product StockLevel (creating it if it doesn't exist),
 * then immediately runs the backorder consolidation check — oldest backorders served first.
 *
 * @param {string} companyId
 * @param {{ warehouseId: string, productId: string, quantity: number }} params
 */
export async function addStock(companyId, { warehouseId, productId, quantity }) {
  // Validate the warehouse belongs to this company
  const warehouse = await prisma.warehouse.findFirst({
    where: { id: warehouseId, companyId },
  });
  if (!warehouse) {
    const { httpError } = await import("../utils/httpError.js");
    throw httpError(404, "Warehouse not found");
  }

  // Upsert the StockLevel row
  const stockLevel = await prisma.stockLevel.upsert({
    where: { warehouseId_productId: { warehouseId, productId } },
    create: {
      warehouseId,
      productId,
      companyId,
      quantityAvailable: quantity,
      quantityReserved: 0,
      replenishmentThreshold: 10,
    },
    update: {
      quantityAvailable: { increment: quantity },
    },
  });

  await logAction({
    companyId,
    entityType: "StockLevel",
    entityId: stockLevel.id,
    action: "STOCK_ADDED",
    metadata: { warehouseId, productId, quantityAdded: quantity, newTotal: stockLevel.quantityAvailable },
  });

  // ── Backorder consolidation ────────────────────────────────────────────────
  await consolidateBackorders(companyId, productId, stockLevel);

  // Re-fetch for accurate return value
  return prisma.stockLevel.findUnique({ where: { id: stockLevel.id } });
}

/**
 * Processes all open backorder splits for a given product, oldest first.
 * Consumes newly arrived stock to resolve backordered FulfillmentSplits.
 *
 * - Full resolution: sets fulfilledAt=now, isBackorder=false on the split row
 * - Partial resolution: reduces quantityFulfilled on the split, creates a NEW
 *   split row for the still-outstanding remainder (still isBackorder=true)
 * - When every split for a quotation has fulfilledAt set → Quotation becomes FULFILLED
 */
async function consolidateBackorders(companyId, productId, stockLevel) {
  const backorders = await prisma.fulfillmentSplit.findMany({
    where: {
      isBackorder: true,
      fulfilledAt: null,
      stockLevel: { productId },
    },
    include: {
      quotationLine: {
        include: { quotation: { select: { id: true, companyId: true } } },
      },
    },
    orderBy: { id: "asc" }, // FIFO — oldest backorder served first
  });

  let remainingNewStock =
    stockLevel.quantityAvailable - stockLevel.quantityReserved;

  for (const split of backorders) {
    if (remainingNewStock <= 0) break;
    if (split.quotationLine.quotation.companyId !== companyId) continue;

    const owed = split.quantityFulfilled; // this split row holds the outstanding qty
    const canFulfill = Math.min(owed, remainingNewStock);
    const now = new Date();
    const quotationId = split.quotationLine.quotation.id;

    await prisma.$transaction(async (tx) => {
      if (canFulfill >= owed) {
        // Full resolution — mark split as fulfilled
        await tx.fulfillmentSplit.update({
          where: { id: split.id },
          data: { fulfilledAt: now, isBackorder: false },
        });
      } else {
        // Partial resolution — reduce this split, create remainder split
        await tx.fulfillmentSplit.update({
          where: { id: split.id },
          data: { quantityFulfilled: canFulfill, fulfilledAt: now, isBackorder: false },
        });
        await tx.fulfillmentSplit.create({
          data: {
            quotationLineId: split.quotationLineId,
            warehouseId: split.warehouseId,
            stockLevelId: split.stockLevelId,
            quantityFulfilled: owed - canFulfill,
            isBackorder: true,
            fulfilledAt: null,
          },
        });
      }

      // Decrement stock
      await tx.stockLevel.update({
        where: { id: stockLevel.id },
        data: { quantityAvailable: { decrement: canFulfill } },
      });
    });

    remainingNewStock -= canFulfill;

    await logAction({
      companyId,
      entityType: "FulfillmentSplit",
      entityId: split.id,
      action: "BACKORDER_FULFILLED",
      metadata: {
        quotationId,
        productId,
        quantityFulfilled: canFulfill,
        warehouseId: split.warehouseId,
      },
    });

    broadcast(quotationId, {
      event: "BACKORDER_FULFILLED",
      quotationId,
      splitId: split.id,
      quantityFulfilled: canFulfill,
    });

    // Check if this quotation is now fully fulfilled
    await checkAndMarkFulfilled(companyId, quotationId);
  }
}

/**
 * If every FulfillmentSplit for every line of the quotation has fulfilledAt set,
 * transition the Quotation to FULFILLED.
 */
async function checkAndMarkFulfilled(companyId, quotationId) {
  const openSplits = await prisma.fulfillmentSplit.count({
    where: {
      quotationLine: { quotationId },
      fulfilledAt: null,
    },
  });

  if (openSplits === 0) {
    await prisma.quotation.update({
      where: { id: quotationId },
      data: { status: "FULFILLED", lastActivityAt: new Date() },
    });

    await logAction({
      companyId,
      entityType: "Quotation",
      entityId: quotationId,
      action: "FULFILLED",
      metadata: { triggeredBy: "SYSTEM:BACKORDER_CONSOLIDATION" },
    });

    broadcast(quotationId, { event: "QUOTATION_FULFILLED", quotationId });
  }
}
