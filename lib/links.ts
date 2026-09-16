import chronicallyOnline from "@/data/chronicallyOnline.json";

/**
 * When a row is shown on /links. `always` is what an ordinary row is and what a
 * row with nothing recorded falls back to; the other two follow the trip, so a
 * link to a tracker that isn't tracking anything never sits at the top of the
 * page. Every row carries this, which is what makes the trip rows editable
 * instead of hard-coded into the page.
 */
export type LinkVisibility = "always" | "trip" | "report";

/** One row on /links. Order in the array is the order on the page. */
export type SiteLink = { label: string; href: string; visibleWhen?: LinkVisibility };

/** The choices offered in /admin/links, and the set a saved row is checked against. */
export const VISIBILITY_OPTIONS: { value: LinkVisibility; label: string }[] = [
  { value: "always", label: "Show always" },
  { value: "trip", label: "Show only during a trip" },
  { value: "report", label: "Show while the report has updates" },
];

export function isLinkVisibility(value: string): value is LinkVisibility {
  return VISIBILITY_OPTIONS.some((option) => option.value === value);
}

const stravaHref = (chronicallyOnline as { name: string; href: string }[]).find(
  (social) => social.name === "Strava",
)?.href;

/**
 * The two rows /links used to add for itself while a trip was on. They are
 * ordinary rows now — editable, movable, removable — and keep the behaviour
 * that made them automatic in the first place through `visibleWhen`.
 */
export const TRIP_LINKS: SiteLink[] = [
  { label: "Live tracker", href: "/trips/live", visibleWhen: "trip" },
  { label: "Trip report", href: "/trips/live/report", visibleWhen: "report" },
];

/**
 * What /links shows before anyone has edited it in admin. Only a seed: the
 * first save in /admin/links replaces this list wholesale, and an empty saved
 * list means no rows, not "fall back to these".
 */
export const DEFAULT_LINKS: SiteLink[] = [
  ...TRIP_LINKS,
  { label: "Website", href: "/" },
  ...(stravaHref ? [{ label: "Strava", href: stravaHref }] : []),
];

/** What the trip-aware rows are keyed off, as /links knows it at render time. */
export type LinkContext = { isOnTrip: boolean; hasReport: boolean };

/**
 * A dead link at the top of a link page is worse than one fewer link, so the
 * conditions here are the ones /links applied when it owned these rows: the
 * tracker is a live feed only while there is a trip to track, and the report is
 * worth linking to for as long as it has updates in it.
 */
export function isLinkVisible(link: SiteLink, ctx: LinkContext): boolean {
  switch (link.visibleWhen) {
    case "trip":
      return ctx.isOnTrip;
    case "report":
      return ctx.isOnTrip || ctx.hasReport;
    default:
      return true;
  }
}

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
