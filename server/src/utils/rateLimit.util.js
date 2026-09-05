import redis from "../config/redis.js";

const MAX_ATTEMPTS = 5;
const WINDOW_SECONDS = 15 * 60; // 15 minutes

function key(companySlug, email) {
  return `login-attempts:${companySlug}:${email.toLowerCase()}`;
}

// Throws a 429 error if this companySlug+email has failed login too many
// times recently. Call before checking the password.
export async function assertNotRateLimited(companySlug, email) {
  const attempts = await redis.get(key(companySlug, email));
  if (attempts && Number(attempts) >= MAX_ATTEMPTS) {
    const err = new Error("Too many failed login attempts. Try again in a few minutes.");
    err.status = 429;
    throw err;
  }
}

// Call on every failed password check.
export async function recordFailedAttempt(companySlug, email) {
  const k = key(companySlug, email);
  const attempts = await redis.incr(k);
  if (attempts === 1) {
    await redis.expire(k, WINDOW_SECONDS);
  }
}

// Call on successful login to clear the counter.
export async function clearFailedAttempts(companySlug, email) {
  await redis.del(key(companySlug, email));
}
