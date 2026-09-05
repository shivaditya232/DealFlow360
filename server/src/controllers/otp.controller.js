import { requestOtp, verifyOtp } from "../services/otp.service.js";
import { requestOtpSchema, verifyOtpSchema } from "../validators/otp.validator.js";

/**
 * POST /api/otp/request
 * Body: { email }
 * Generates OTP, stores in Redis (2min TTL), sends email.
 */
export async function requestOtpHandler(req, res, next) {
  try {
    const { email } = requestOtpSchema.parse(req.body);
    const result = await requestOtp(email);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/otp/verify
 * Body: { email, otp }
 * Checks OTP against Redis, deletes on success (single-use).
 */
export async function verifyOtpHandler(req, res, next) {
  try {
    const { email, otp } = verifyOtpSchema.parse(req.body);
    const result = await verifyOtp(email, otp);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}
