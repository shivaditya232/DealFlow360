import { createCustomerSchema } from "../validators/customer.validator.js";
import * as customerService from "../services/customer.service.js";

export async function list(req, res, next) {
  try {
    // No longer scoped to req.auth.companyId — see customer.service.js.
    const customers = await customerService.listCustomers();
    res.json(customers);
  } catch (err) {
    next(err);
  }
}

export async function create(req, res, next) {
  try {
    const data = createCustomerSchema.parse(req.body);
    const customer = await customerService.createCustomer({ companyId: req.auth.companyId, ...data });
    res.status(201).json(customer);
  } catch (err) {
    next(err);
  }
}
