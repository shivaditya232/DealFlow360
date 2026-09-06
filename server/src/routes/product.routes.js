import { Router } from "express";
import { authenticate, requireInternal, authorize } from "../middleware/auth.middleware.js";
import * as productController from "../controllers/product.controller.js";

const router = Router();

router.use(authenticate, requireInternal);

// Any internal role can browse the catalog (reps need it to build quotations).
router.get("/", productController.list);

// Only Admin manages the catalog itself (PS: "Admin: manages backend setup —
// products, price lists, discount tiers, warehouses, subscription plans").
router.post("/", authorize("ADMIN"), productController.create);
router.patch("/:id", authorize("ADMIN"), productController.update);
router.delete("/:id", authorize("ADMIN"), productController.remove);

export default router;
