import crypto from "crypto";

// Sessions carry their issue time so they expire server-side.
export const SESSION_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

// The token is signed on whichever serverless instance handled the login and
// verified on whichever one handles the next request. Those are different
// machines, so a token can legitimately look very slightly future-dated. Reject
// only clearly bogus issue times, not sub-second skew.
const CLOCK_SKEW_TOLERANCE_MS = 1000 * 60 * 5; // 5 minutes

// Single source of truth for how the session cookie is written, so that login
// and logout can't drift apart on `path` (a mismatch leaves logout unable to
// clear the cookie it set).
export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  // "lax", not "strict": with strict the browser withholds the cookie on any
  // cross-site top-level navigation, so arriving at /admin from a bookmark
  // manager, a chat link, or an OAuth-style redirect shows the login form even
  // though the session is perfectly valid. Lax still withholds the cookie on
  // cross-site POSTs, which is the CSRF case that matters here.
  sameSite: "lax",
  path: "/admin",
  maxAge: SESSION_MAX_AGE_MS / 1000,
} as const;

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
  if (
    !Number.isFinite(age) ||
    age < -CLOCK_SKEW_TOLERANCE_MS ||
    age > SESSION_MAX_AGE_MS
  ) {
    return false;
  }

  try {
    return safeEqual(mac, sign(issuedAt));
  } catch {
    return false;
  }
}

/**
 * Same checks as verifyToken, but reports which one failed so /admin/session
 * can explain a rejected session on a phone, where DevTools isn't practical.
 * Never returns any part of the token, the MAC, or the signing secret.
 */
export function describeToken(
  token: string | undefined,
): { ok: boolean; verdict: string; issuedAt?: Date } {
  if (!token) {
    return {
      ok: false,
      verdict:
        "No admin_session cookie arrived with this request. Either you have not signed in on this host, or the cookie is being written for a different host than the one you are reading.",
    };
  }

  const [issuedAt, mac] = token.split(".");
  if (!issuedAt || !mac) {
    return {
      ok: false,
      verdict:
        "Cookie is in the older format that predates server-side expiry, so it is rejected. Signing in once replaces it.",
    };
  }

  const ms = Number(issuedAt);
  if (!Number.isFinite(ms)) {
    return { ok: false, verdict: "Cookie has a non-numeric issue time and cannot be read." };
  }

  const at = new Date(ms);
  const age = Date.now() - ms;
  if (age > SESSION_MAX_AGE_MS) {
    return { ok: false, verdict: "Session is past its 30-day lifetime. Sign in again.", issuedAt: at };
  }
  if (age < -CLOCK_SKEW_TOLERANCE_MS) {
    return {
      ok: false,
      verdict:
        "Issue time is further in the future than the allowed clock skew, so this server considers it invalid.",
      issuedAt: at,
    };
  }

  let signatureOk = false;
  try {
    signatureOk = safeEqual(mac, sign(issuedAt));
  } catch {
    signatureOk = false;
  }
  if (!signatureOk) {
    return {
      ok: false,
      verdict:
        "Signature does not match. The cookie was signed with a different ADMIN_SECRET/ADMIN_PASSWORD than this deployment is running with — usually a rotated password, or a value that reaches one deployment decrypted and another still encrypted.",
      issuedAt: at,
    };
  }

  return { ok: true, verdict: "Session cookie is valid. Admin pages should load signed in.", issuedAt: at };
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
