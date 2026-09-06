import prisma from "../config/prisma.js";
import { httpError } from "../utils/httpError.js";

// Warehouses were previously seed-only — the Admin config screen could view
// stock levels inside a warehouse and add stock to one, but there was no
// endpoint at all to create, rename, or remove a warehouse itself.

export async function listWarehouses(companyId) {
  return prisma.warehouse.findMany({
    where: { companyId },
    orderBy: { name: "asc" },
  });
}

export async function createWarehouse(companyId, data) {
  return prisma.warehouse.create({
    data: {
      companyId,
      name: data.name,
      shippingCostWeight: data.shippingCostWeight,
    },
  });
}

export async function updateWarehouse(companyId, warehouseId, data) {
  const existing = await prisma.warehouse.findFirst({ where: { id: warehouseId, companyId } });
  if (!existing) throw httpError(404, "Warehouse not found");

  return prisma.warehouse.update({
    where: { id: warehouseId },
    data,
  });
}

// Hard-deletes at the DB level. Warehouse has FK relations from StockLevel/
// FulfillmentSplit/StockReservation with no onDelete: Cascade, so Postgres
// refuses the delete (P2003) once anything has ever been stocked/shipped
// through it — surfaced as a friendly 409 rather than a 500, same pattern as
// product deletion.
export async function deleteWarehouse(companyId, warehouseId) {
  const existing = await prisma.warehouse.findFirst({ where: { id: warehouseId, companyId } });
  if (!existing) throw httpError(404, "Warehouse not found");

  try {
    await prisma.warehouse.delete({ where: { id: warehouseId } });
  } catch (err) {
    if (err.code === "P2003" || err.code === "P2014") {
      throw httpError(
        409,
        "Can't delete this warehouse — it already has stock records or fulfillment history tied to it. Move or clear its stock first."
      );
    }
    throw err;
  }
  return { id: warehouseId, deleted: true };
}
