import { createWarehouseSchema, updateWarehouseSchema } from "../validators/warehouse.validator.js";
import * as warehouseService from "../services/warehouse.service.js";

export async function list(req, res, next) {
  try {
    const warehouses = await warehouseService.listWarehouses(req.auth.companyId);
    res.json(warehouses);
  } catch (err) {
    next(err);
  }
}

export async function create(req, res, next) {
  try {
    const data = createWarehouseSchema.parse(req.body);
    const warehouse = await warehouseService.createWarehouse(req.auth.companyId, data);
    res.status(201).json(warehouse);
  } catch (err) {
    next(err);
  }
}

export async function update(req, res, next) {
  try {
    const data = updateWarehouseSchema.parse(req.body);
    const warehouse = await warehouseService.updateWarehouse(req.auth.companyId, req.params.id, data);
    res.json(warehouse);
  } catch (err) {
    next(err);
  }
}

export async function remove(req, res, next) {
  try {
    const result = await warehouseService.deleteWarehouse(req.auth.companyId, req.params.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
}
