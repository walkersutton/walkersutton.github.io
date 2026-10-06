import { SITE_CONFIG } from "./config";
import type { StoredPasskey } from "./live-state";

/**
 * Adding a passkey when one already exists needs a recent sign-in, so a
 * copied month-old session cookie can't plant a passkey of its own.
 */
export const FRESH_SESSION_MS = 15 * 60 * 1000;

export type RelyingParty = { rpID: string; origins: string[] };

/** The domain production passkeys belong to. */
export function siteRpID(): string {
  return new URL(SITE_CONFIG.siteUrl).hostname;
}

/**
 * Where passkeys can work for a request to `host`, or null where they can't.
 * A passkey is bound to one domain: one made on walkersutton.com is never
 * offered on localhost or a *.vercel.app preview.
 */
export function relyingParty(host: string | null): RelyingParty | null {
  const hostname = (host ?? "").split(":")[0].toLowerCase();
  if (process.env.NODE_ENV === "development") {
    // Browsers allow WebAuthn on http://localhost, but not on an IP address.
    return hostname === "localhost" ? { rpID: "localhost", origins: [`http://${host}`] } : null;
  }
  const site = new URL(SITE_CONFIG.siteUrl);
  const rpID = site.hostname;
  if (hostname !== rpID && !hostname.endsWith(`.${rpID}`)) return null;
  return { rpID, origins: [site.origin, `https://www.${rpID}`] };
}

/**
 * Whether the password form may sign anyone in.
 *
 * Until the first production passkey exists the password is the only way in,
 * and the only way to add one. After that it's off, unless the emergency
 * switch ADMIN_PASSWORD_LOGIN=on is set. Local development always allows it.
 * `passkeysForSite` counts production passkeys whatever host this is, so a
 * preview deployment can't become a back door that still takes the password.
 */
export function passwordSignInAllowed(passkeysForSite: number, degraded: boolean): boolean {
  if (process.env.NODE_ENV === "development") return true;
  if (process.env.ADMIN_PASSWORD_LOGIN === "on") return true;
  // An unreadable store is "unknown", not "no passkeys": a Blob outage
  // shouldn't quietly reopen the password door.
  return !degraded && passkeysForSite === 0;
}

export function passkeysFor(passkeys: StoredPasskey[], rpID: string): StoredPasskey[] {
  return passkeys.filter((p) => p.rpID === rpID);
}

// The authenticators people actually use, by AAGUID. Browsers may zero the
// AAGUID out, in which case the device name has to do.
const PROVIDERS: Record<string, string> = {
  "fbfc3007-154e-4ecc-8c0b-6e020557d7bd": "iCloud Keychain",
  "dd4ec289-e01d-41c9-bb89-70fa845d4bf2": "iCloud Keychain",
  "ea9b8d66-4d01-1d21-3ce4-b6b48cb575d4": "Google Password Manager",
  "adce0002-35bc-c60a-648b-0b25f1f05503": "Chrome on Mac",
  "08987058-cadc-4b81-b6e1-30de50dcbe96": "Windows Hello",
  "9ddd1817-af5a-4672-a2b9-3e3dd95000a9": "Windows Hello",
  "6028b017-b1d4-4c02-b4b3-afcdafc96bb2": "Windows Hello",
  "bada5566-a7aa-401f-bd96-45619a55120d": "1Password",
  "d548826e-79b4-db40-a3d8-11116f7e8349": "Bitwarden",
  "531126d6-e717-415c-9320-3d9aa6981239": "Dashlane",
};

export function providerName(aaguid: string): string | undefined {
  return PROVIDERS[aaguid.toLowerCase()];
}

export function deviceName(userAgent: string | null): string | undefined {
  if (!userAgent) return undefined;
  if (/iPhone/.test(userAgent)) return "iPhone";
  if (/iPad/.test(userAgent)) return "iPad";
  if (/Android/.test(userAgent)) return "Android";
  if (/Macintosh|Mac OS X/.test(userAgent)) return "Mac";
  if (/Windows/.test(userAgent)) return "Windows";
  if (/CrOS/.test(userAgent)) return "Chromebook";
  if (/Linux/.test(userAgent)) return "Linux";
  return undefined;
}
