import crypto from "crypto";
import { getAuthState } from "./live-state";

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

export const SESSION_COOKIE = "admin_session";

// Holds the challenge between asking the browser for a passkey and checking
// what it sent back. Signed and short-lived, so it can't be swapped for a
// challenge from an old, captured response.
export const CHALLENGE_COOKIE = "admin_webauthn";
const CHALLENGE_TTL_MS = 1000 * 60 * 5;
export const CHALLENGE_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  path: "/admin",
  maxAge: CHALLENGE_TTL_MS / 1000,
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

function hmac(message: string): string {
  return crypto.createHmac("sha256", secret()).update(message).digest("hex");
}

function sign(issuedAt: string, epoch: string): string {
  return hmac(`admin-session.${issuedAt}.${epoch}`);
}

export type Session = { issuedAt: number; epoch: number };

/**
 * The caller's admin session, or null. Checks the signature and age, then
 * that it hasn't been revoked: "sign out other sessions" bumps a stored
 * epoch, and anything signed under an older one stops working. A newer epoch
 * than stored is fine — it was minted after a bump this instance's cached
 * state hasn't caught up with yet.
 */
export async function getSession(): Promise<Session | null> {
  const { cookies } = await import("next/headers");
  const session = readToken((await cookies()).get(SESSION_COOKIE)?.value);
  if (!session) return null;
  const { sessionEpoch } = await getAuthState();
  return session.epoch >= sessionEpoch ? session : null;
}

/** For route handlers. Server Actions use requireSession, which throws. */
export async function isAdminSession(): Promise<boolean> {
  return (await getSession()) !== null;
}

export function signToken(epoch: number): string {
  const issuedAt = Date.now().toString();
  return `${issuedAt}.${epoch}.${sign(issuedAt, String(epoch))}`;
}

/** Signature and age only; revocation is getSession's job. */
function readToken(token: string | undefined): Session | null {
  const [issuedAt, epoch, mac] = token?.split(".") ?? [];
  if (!issuedAt || !epoch || !mac) return null;

  const age = Date.now() - Number(issuedAt);
  if (
    !Number.isFinite(age) ||
    age < -CLOCK_SKEW_TOLERANCE_MS ||
    age > SESSION_MAX_AGE_MS ||
    !/^\d+$/.test(epoch)
  ) {
    return null;
  }

  try {
    return safeEqual(mac, sign(issuedAt, epoch))
      ? { issuedAt: Number(issuedAt), epoch: Number(epoch) }
      : null;
  } catch {
    return null;
  }
}

export function signChallenge(purpose: "auth" | "reg", challenge: string): string {
  const expires = (Date.now() + CHALLENGE_TTL_MS).toString();
  return `${purpose}.${challenge}.${expires}.${hmac(`webauthn.${purpose}.${challenge}.${expires}`)}`;
}

/** The challenge if the cookie is ours, for this purpose, and unexpired. */
export function readChallenge(value: string | undefined, purpose: "auth" | "reg"): string | null {
  const [p, challenge, expires, mac] = value?.split(".") ?? [];
  if (p !== purpose || !challenge || !expires || !mac) return null;
  if (!(Number(expires) > Date.now())) return null;
  try {
    return safeEqual(mac, hmac(`webauthn.${p}.${challenge}.${expires}`)) ? challenge : null;
  } catch {
    return null;
  }
}

/**
 * Same checks as getSession, but reports which one failed so /admin/session
 * can explain a rejected session on a phone, where DevTools isn't practical.
 * Never returns any part of the token, the MAC, or the signing secret.
 */
export function describeToken(
  token: string | undefined,
  currentEpoch: number,
): { ok: boolean; verdict: string; issuedAt?: Date } {
  if (!token) {
    return {
      ok: false,
      verdict:
        "No admin_session cookie arrived with this request. Either you have not signed in on this host, or the cookie is being written for a different host than the one you are reading.",
    };
  }

  const [issuedAt, epoch, mac] = token.split(".");
  if (!issuedAt || !epoch || !mac) {
    return {
      ok: false,
      verdict:
        "Cookie is in an older format from before passkeys and revocable sessions, so it is rejected. Signing in once replaces it.",
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
    signatureOk = safeEqual(mac, sign(issuedAt, epoch));
  } catch {
    signatureOk = false;
  }
  if (!signatureOk) {
    return {
      ok: false,
      verdict:
        "Signature does not match. The cookie was signed with a different ADMIN_SECRET/ADMIN_PASSWORD than this deployment is running with — usually a rotated secret, or a value that reaches one deployment decrypted and another still encrypted.",
      issuedAt: at,
    };
  }

  if (Number(epoch) < currentEpoch) {
    return {
      ok: false,
      verdict: "This session was signed out from Security → Sign out other sessions. Sign in again.",
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
