import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import * as configController from "../controllers/config.controller.js";

const router = Router();

router.get("/discount-limits", authenticate, configController.getDiscountLimits);

export default router;
