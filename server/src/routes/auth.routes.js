import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.middleware.js";
import * as authController from "../controllers/auth.controller.js";

const router = Router();

router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.post("/otp-login", authController.otpLogin);

// Admin-only: create a MANAGER/FINANCE/SALES_REP/ADMIN teammate directly in
// the Admin's own company (still requires the email to already be
// OTP-verified via POST /api/otp/request + /api/otp/verify, same as signup).
router.get("/team-members", authenticate, authorize("ADMIN"), authController.listTeamMembers);
router.post("/team-members", authenticate, authorize("ADMIN"), authController.createTeamMember);
router.patch("/team-members/:id", authenticate, authorize("ADMIN"), authController.updateTeamMember);
router.delete("/team-members/:id", authenticate, authorize("ADMIN"), authController.removeTeamMember);

export default router;
