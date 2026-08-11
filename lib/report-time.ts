import { SITE_CONFIG } from "./config";

/**
 * Offered when correcting an entry's zone by hand. A ride across the US only
 * passes through these, and a full IANA list is unusable on a phone. Arizona is
 * separate because it doesn't observe DST, so it isn't Mountain in summer.
 */
export const TRIP_TIME_ZONES: { value: string; label: string }[] = [
  { value: "America/Los_Angeles", label: "Pacific" },
  { value: "America/Denver", label: "Mountain" },
  { value: "America/Phoenix", label: "Arizona (no DST)" },
  { value: "America/Chicago", label: "Central" },
  { value: "America/New_York", label: "Eastern" },
];

/** Whether a string is an IANA zone this runtime knows. */
export function isValidTimeZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/**
 * The zone a report entry should be rendered in: the one it was posted from,
 * falling back to the site's for entries written before that was recorded (and
 * for anything a browser reports that Intl doesn't recognise).
 */
export function entryTimeZone(tz?: string): string {
  if (!tz || !isValidTimeZone(tz)) return SITE_CONFIG.timeZone;
  return tz;
}
