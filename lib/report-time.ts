import { SITE_CONFIG } from "./config";

/**
 * The zone a report entry should be rendered in: the one it was posted from,
 * falling back to the site's for entries written before that was recorded (and
 * for anything a browser reports that Intl doesn't recognise).
 */
/** Whether a string is an IANA zone this runtime knows. */
export function isValidTimeZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export function entryTimeZone(tz?: string): string {
  if (!tz || !isValidTimeZone(tz)) return SITE_CONFIG.timeZone;
  return tz;
}
