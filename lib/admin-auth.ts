import crypto from "crypto";

// Sessions carry their issue time so they expire server-side. Bump this and the
// cookie maxAge in app/admin/actions.ts together.
export const SESSION_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

function secret(): string {
  const value = process.env.ADMIN_SECRET ?? process.env.ADMIN_PASSWORD;
  if (!value) {
    // Never fall back to a default: a known secret makes the session cookie
    // forgeable by anyone who can read this file.
    throw new Error("ADMIN_SECRET or ADMIN_PASSWORD must be set");
  }
  return value;
}

/** Constant-time compare that tolerates unequal lengths. */
function safeEqual(a: string, b: string): boolean {
  const ha = crypto.createHash("sha256").update(a).digest();
  const hb = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(ha, hb);
}

function sign(issuedAt: string): string {
  return crypto
    .createHmac("sha256", secret())
    .update(`admin-session.${issuedAt}`)
    .digest("hex");
}

export function signToken(): string {
  const issuedAt = Date.now().toString();
  return `${issuedAt}.${sign(issuedAt)}`;
}

/** Returns false rather than throwing for any malformed, expired, or bad token. */
export function verifyToken(token: string): boolean {
  const [issuedAt, mac] = token.split(".");
  if (!issuedAt || !mac) return false;

  const age = Date.now() - Number(issuedAt);
  if (!Number.isFinite(age) || age < 0 || age > SESSION_MAX_AGE_MS) return false;

  try {
    return safeEqual(mac, sign(issuedAt));
  } catch {
    return false;
  }
}

export function verifyPassword(input: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  return safeEqual(input, expected);
}

export function verifyCronSecret(authHeader: string | null): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected || !authHeader) return false;
  return safeEqual(authHeader, `Bearer ${expected}`);
}
