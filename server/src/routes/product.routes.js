import { Router } from "express";
import { authenticate, requireInternal } from "../middleware/auth.middleware.js";
import * as productController from "../controllers/product.controller.js";

const router = Router();

router.use(authenticate, requireInternal);
router.get("/", productController.list);

export default router;
