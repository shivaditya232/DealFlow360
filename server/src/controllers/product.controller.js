import { createProductSchema, updateProductSchema } from "../validators/product.validator.js";
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

export async function update(req, res, next) {
  try {
    const data = updateProductSchema.parse(req.body);
    const product = await productService.updateProduct(req.auth.companyId, req.params.id, data);
    res.json(product);
  } catch (err) {
    next(err);
  }
}

export async function remove(req, res, next) {
  try {
    const result = await productService.deleteProduct(req.auth.companyId, req.params.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
}
