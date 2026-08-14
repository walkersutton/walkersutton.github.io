import chronicallyOnline from "@/data/chronicallyOnline.json";

/** One row on /links. Order in the array is the order on the page. */
export type SiteLink = { label: string; href: string };

const stravaHref = (chronicallyOnline as { name: string; href: string }[]).find(
  (social) => social.name === "Strava",
)?.href;

/**
 * What /links shows before anyone has edited it in admin. Only a seed: the
 * first save in /admin/links replaces this list wholesale, and an empty saved
 * list means no rows, not "fall back to these".
 */
export const DEFAULT_LINKS: SiteLink[] = [
  { label: "Website", href: "/" },
  ...(stravaHref ? [{ label: "Strava", href: stravaHref }] : []),
];

/**
 * Links are rendered as anchors, so an unchecked href is a script injection
 * waiting to happen — `javascript:` and `data:` URLs run on click. Admin-only
 * doesn't make that safe: it makes it a foothold for anyone who gets a session.
 * Internal paths and http(s) only.
 */
export function isAllowedHref(href: string): boolean {
  if (href.startsWith("/")) return true;
  try {
    const { protocol } = new URL(href);
    return protocol === "https:" || protocol === "http:";
  } catch {
    return false;
  }
}
