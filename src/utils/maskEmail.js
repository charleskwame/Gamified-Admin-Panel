/**
 * Mask a student email for privacy when displayed in admin views.
 *
 * Format (matching `ch**********gh@gmail.com`):
 *   - Keep the first 2 and last 2 characters of the local part.
 *   - Replace everything in between with a fixed block of 10 asterisks.
 *   - Keep the full domain.
 *
 * Locally-parts 4 chars or shorter are fully redacted so the trickle of
 * revealed characters can't leak the actual address.
 */
export function maskEmail(email) {
  if (!email || typeof email !== "string") return "";
  const atIdx = email.indexOf("@");
  if (atIdx <= 0) return email;

  const local = email.slice(0, atIdx);
  const domain = email.slice(atIdx);

  if (local.length <= 4) return `${"*".repeat(10)}${domain}`;

  return `${local.slice(0, 2)}${"*".repeat(10)}${local.slice(-2)}${domain}`;
}