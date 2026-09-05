import * as productService from "../services/product.service.js";

export async function list(req, res, next) {
  try {
    const products = await productService.listProducts(req.auth.companyId);
    res.json(products);
  } catch (err) {
    next(err);
  }
}
