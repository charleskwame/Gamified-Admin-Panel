/**
 * OTP helpers for the lecturer sign-up flow.
 *
 * The raw code is only ever sent to the lecturer's email (via EmailJS). Only a
 * SHA-256 hash + expiry is persisted in Firestore so the plaintext code cannot
 * leak from the database.
 */

export const EMAIL_OTP_LIFETIME_MS = 10 * 60 * 1000; // 10 minutes
export const MAX_OTP_ATTEMPTS = 5;

function toBytes(str) {
  return new TextEncoder().encode(str);
}

async function sha256Hex(input) {
  const digest = await crypto.subtle.digest("SHA-256", toBytes(input));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Generate a random 6-digit numeric code (no leading zeros). */
export function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

/** Hash a code before storing it in Firestore. */
export function hashOtp(code) {
  return sha256Hex(`gamified-admin-panel:otp:${code}`);
}

/**
 * Constant-time comparison of an entered code against a stored hash.
 * Returns true only when the input is a 6-digit code matching the hash.
 */
export async function isOtpValid(input, expectedHash) {
  if (!/^\d{6}$/.test(input || "")) return false;
  const candidate = await hashOtp(input);
  if (candidate.length !== expectedHash.length) return false;
  let diff = 0;
  for (let i = 0; i < candidate.length; i++) {
    diff |= candidate.charCodeAt(i) ^ expectedHash.charCodeAt(i);
  }
  return diff === 0;
}