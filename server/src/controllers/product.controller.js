import { createProductSchema } from "../validators/product.validator.js";
import * as productService from "../services/product.service.js";

export async function list(req, res, next) {
  try {
    const products = await productService.listProducts(req.auth.companyId);
    res.json(products);
  } catch (err) {
    next(err);
  }
}

export async function create(req, res, next) {
  try {
    const data = createProductSchema.parse(req.body);
    const product = await productService.createProduct(req.auth.companyId, data);
    res.status(201).json(product);
  } catch (err) {
    next(err);
  }
}
