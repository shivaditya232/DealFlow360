import redis from "../config/redis.js";
import { httpError } from "../utils/httpError.js";
import crypto from "crypto";

// ── Constants ─────────────────────────────────────────────────────────────────

const OTP_TTL_SECONDS = 120;          // 2 minutes — Redis auto-deletes the key
const OTP_REQUEST_WINDOW = 10 * 60;   // 10-minute window for request-rate limiting
const MAX_REQUEST_PER_WINDOW = 3;     // Max 3 OTP requests per email per 10 min
const MAX_VERIFY_ATTEMPTS = 5;        // Max 5 wrong guesses before OTP is burned

// ── Redis key helpers ─────────────────────────────────────────────────────────

const otpKey        = (email) => `otp:${email}`;
const attemptKey    = (email) => `otp:attempts:${email}`;
const requestRlKey  = (email) => `otp:request-rl:${email}`;

// ── OTP generation ────────────────────────────────────────────────────────────

/**
 * Generates a cryptographically random 6-digit OTP string.
 * crypto.randomInt(min, max) is exclusive of max, so range [100000, 999999].
 * We use crypto — NOT Math.random() — because Math.random() is not
 * cryptographically secure and can be predicted in some environments.
 */
function generateOtp() {
  return crypto.randomInt(100000, 1000000).toString();
}

// ── Public service functions ──────────────────────────────────────────────────

/**
 * Generates a 6-digit OTP, stores it in Redis with a 2-minute TTL,
 * and sends it to the given email address.
 *
 * Rate-limited: max 3 requests per email per 10 minutes — prevents inbox spam.
 *
 * @param {string} email - Already normalised (trimmed, lowercased) by Zod.
 * @returns {{ message: string, expiresInSeconds: number }}
 */
export async function requestOtp(email) {
  // ── 1. Request-rate limiting (prevents OTP spam to the same inbox) ──────────
  const rlKey = requestRlKey(email);
  const requestCount = await redis.incr(rlKey);
  if (requestCount === 1) {
    // First request in this window — set the window TTL
    await redis.expire(rlKey, OTP_REQUEST_WINDOW);
  }
  if (requestCount > MAX_REQUEST_PER_WINDOW) {
    throw httpError(
      429,
      "Too many OTP requests. Please wait a few minutes before trying again."
    );
  }

  // ── 2. Generate OTP and store in Redis with 2-minute TTL ────────────────────
  const otp = generateOtp();
  await redis.set(otpKey(email), otp, "EX", OTP_TTL_SECONDS);

  // ── 3. Reset the verify-attempt counter for this email ──────────────────────
  // (Fresh OTP = fresh attempt window — old failed attempts no longer apply)
  await redis.del(attemptKey(email));

  // ── 4. Send the OTP to the user ─────────────────────────────────────────────
  await sendOtpEmail(email, otp);

  return { message: "OTP sent", expiresInSeconds: OTP_TTL_SECONDS };
}

/**
 * Verifies a submitted OTP against what's stored in Redis.
 *
 * - If the 2-minute TTL has elapsed, Redis has already deleted the key → 400.
 * - After 5 wrong guesses, the OTP is burned and the user must request a new one.
 * - On a correct match, both the OTP key and the attempt key are deleted immediately
 *   (single-use: the same OTP cannot be reused even if time remains on the TTL).
 *
 * @param {string} email         - Already normalised by Zod.
 * @param {string} submittedOtp  - The 6-digit string the user typed.
 * @returns {{ verified: true }}
 */
export async function verifyOtp(email, submittedOtp) {
  const storedOtp = await redis.get(otpKey(email));

  // ── 1. Check TTL expiry ──────────────────────────────────────────────────────
  if (!storedOtp) {
    // Redis returned null — key either never existed, or TTL already elapsed.
    // Same message for both: don't leak which case it is.
    throw httpError(400, "OTP expired or not found. Please request a new one.");
  }

  // ── 2. Rate-limit wrong guesses ─────────────────────────────────────────────
  // Increment BEFORE checking correctness so a correct guess on the 6th attempt
  // is still rejected (the attacker shouldn't be rewarded after exceeding the cap).
  const aKey = attemptKey(email);
  const attempts = await redis.incr(aKey);
  if (attempts === 1) {
    // Tie the attempt counter TTL to the OTP TTL so it self-cleans
    await redis.expire(aKey, OTP_TTL_SECONDS);
  }
  if (attempts > MAX_VERIFY_ATTEMPTS) {
    // Burn the OTP immediately — force the user to request a fresh one
    await redis.del(otpKey(email));
    await redis.del(aKey);
    throw httpError(
      429,
      "Too many incorrect attempts. Please request a new OTP."
    );
  }

  // ── 3. Compare OTPs ─────────────────────────────────────────────────────────
  if (storedOtp !== submittedOtp) {
    throw httpError(400, "Incorrect OTP.");
  }

  // ── 4. Correct — delete both keys immediately (single-use guarantee) ─────────
  await redis.del(otpKey(email));
  await redis.del(aKey);

  return { verified: true };
}

// ── Email sender (stub) ───────────────────────────────────────────────────────

/**
 * Sends the OTP to the user's email address.
 *
 * TODO: replace the console.log with a real provider:
 *   - Nodemailer + SMTP for self-hosted
 *   - Resend (resend.com) for managed transactional email
 *   - AWS SES for scale
 *
 * @param {string} email
 * @param {string} otp
 */
async function sendOtpEmail(email, otp) {
  // DEV-ONLY: log to console so you can grab the OTP without a real mail server
  console.log(`[DEV ONLY] OTP for ${email}: ${otp}`);
}
