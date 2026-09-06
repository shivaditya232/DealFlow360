import { Router } from "express";
import { authenticate, requireInternal, authorize } from "../middleware/auth.middleware.js";
import * as warehouseController from "../controllers/warehouse.controller.js";

const router = Router();

router.use(authenticate, requireInternal);

// Any internal role can see the warehouse list (needed to pick a target
// warehouse when adding stock); only Admin manages warehouses themselves.
router.get("/", warehouseController.list);
router.post("/", authorize("ADMIN"), warehouseController.create);
router.patch("/:id", authorize("ADMIN"), warehouseController.update);
router.delete("/:id", authorize("ADMIN"), warehouseController.remove);

export default router;
