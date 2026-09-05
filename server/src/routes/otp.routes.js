import { Router } from "express";
import { requestOtpHandler, verifyOtpHandler } from "../controllers/otp.controller.js";

const router = Router();

// No auth middleware — OTP is used BEFORE the user has a JWT (pre-login/signup flow)

// POST /api/otp/request  — generate + send OTP
router.post("/request", requestOtpHandler);

// POST /api/otp/verify   — verify submitted OTP
router.post("/verify", verifyOtpHandler);

export default router;
