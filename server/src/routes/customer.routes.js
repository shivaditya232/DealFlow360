import { Router } from "express";
import { authenticate, requireInternal } from "../middleware/auth.middleware.js";
import * as customerController from "../controllers/customer.controller.js";

const router = Router();

router.use(authenticate, requireInternal);
router.get("/", customerController.list);
router.post("/", customerController.create);

export default router;
