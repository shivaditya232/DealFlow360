import redis from "../config/redis.js";
import { httpError } from "../utils/httpError.js";
import crypto from "crypto";
import nodemailer from "nodemailer";

// ── Constants ─────────────────────────────────────────────────────────────────

const OTP_TTL_SECONDS = 120;          // 2 minutes — Redis auto-deletes the key
const OTP_REQUEST_WINDOW = 10 * 60;   // 10-minute window for request-rate limiting
const MAX_REQUEST_PER_WINDOW = 3;     // Max 3 OTP requests per email per 10 min
const MAX_VERIFY_ATTEMPTS = 5;        // Max 5 wrong guesses before OTP is burned

// ── Redis key helpers ─────────────────────────────────────────────────────────

const otpKey = (email) => `otp:${email}`;
const attemptKey = (email) => `otp:attempts:${email}`;
const requestRlKey = (email) => `otp:request-rl:${email}`;
const verifiedKey = (email) => `otp:email-verified:${email}`;

// How long a verified-email flag survives after a successful /otp/verify,
// before signup has to consume it. Long enough to fill out the rest of the
// signup form, short enough that a verified flag can't be replayed much later.
const EMAIL_VERIFIED_TTL_SECONDS = 15 * 60; // 15 minutes

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
  // Dev/demo fallback: if Gmail SMTP isn't configured right (wrong/missing
  // app password, account policy blocking it, etc.), don't let that block
  // signup entirely — log the OTP to the server console instead, so local
  // testing and demos can keep moving while SMTP gets sorted out separately.
  // Once SMTP_USER/SMTP_PASS actually work, real email just starts being used
  // again automatically — no code change needed.
  let emailSent = true;
  try {
    await sendOtpEmail(email, otp);
  } catch (err) {
    emailSent = false;
    console.warn(
      `[otp] Email delivery failed for ${email} — falling back to console.
` +
        `[otp] Reason: ${err.message}
` +
        `[otp] >>> OTP for ${email}: ${otp} <<<`
    );
  }

  return { message: "OTP sent", expiresInSeconds: OTP_TTL_SECONDS, emailSent };
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
    const remaining = Math.max(0, MAX_VERIFY_ATTEMPTS - attempts);
    const err = httpError(400, `Incorrect OTP. ${remaining} attempt(s) remaining.`);
    err.remainingAttempts = remaining;
    throw err;
  }

  // ── 4. Correct — delete both keys immediately (single-use guarantee) ─────────
  await redis.del(otpKey(email));
  await redis.del(aKey);

  // Flag this email as verified so signup() can check + consume it — this is
  // what actually links "OTP verified" to "account created with this email".
  // Without this flag, verifying the OTP proved nothing to the signup call.
  await redis.set(verifiedKey(email), "1", "EX", EMAIL_VERIFIED_TTL_SECONDS);

  return { verified: true };
}

/**
 * Checks whether this email currently has a live "verified" flag (i.e. the
 * OTP was verified within the last EMAIL_VERIFIED_TTL_SECONDS and hasn't
 * been consumed by a signup yet).
 *
 * @param {string} email
 * @returns {Promise<boolean>}
 */
export async function isEmailVerified(email) {
  return Boolean(await redis.get(verifiedKey(email)));
}

/**
 * Deletes the verified flag — call this once signup has actually used it,
 * so the same OTP verification can't be replayed to create a second account.
 *
 * @param {string} email
 */
export async function consumeEmailVerification(email) {
  await redis.del(verifiedKey(email));
}

// ── Email sender ──────────────────────────────────────────────────────────────

/**
 * Nodemailer transporter — Gmail SMTP with App Password auth.
 * Set SMTP_USER and SMTP_PASS in .env (use a Gmail App Password, not your
 * real Gmail password — generate one at https://myaccount.google.com/apppasswords).
 */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Sends the OTP to the user's email address via Gmail SMTP.
 *
 * @param {string} email
 * @param {string} otp
 */
async function sendOtpEmail(email, otp) {
  await transporter.sendMail({
    from: `"DealFlow360" <${process.env.SMTP_USER}>`,
    to: email,
    subject: "Your DealFlow360 OTP Code",
    text: `Your one-time password is: ${otp}\n\nThis code expires in 2 minutes. Do not share it with anyone.`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px">
        <h2 style="margin:0 0 8px;color:#111827">Your OTP Code</h2>
        <p style="color:#6b7280;margin:0 0 24px">Use the code below to verify your identity on DealFlow360.</p>
        <div style="font-size:36px;font-weight:700;letter-spacing:8px;color:#4f46e5;text-align:center;padding:16px;background:#f5f3ff;border-radius:8px">
          ${otp}
        </div>
        <p style="color:#9ca3af;font-size:13px;margin:24px 0 0">
          This code expires in <strong>2 minutes</strong>. If you didn't request this, you can safely ignore this email.
        </p>
      </div>
    `,
  });
}
