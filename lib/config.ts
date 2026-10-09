export const SITE_CONFIG = {
  title: "Walker Sutton",
  description: "69696969696969696969",
  siteUrl: "https://walkersutton.com",
  city: "Seattle",
  // Timestamps are stored as UTC instants; render them in this zone so output
  // doesn't depend on the server's TZ (UTC on Vercel) or the viewer's.
  timeZone: "America/Los_Angeles",
};

/**
 * Per-page `alternates`. Next shallow-merges metadata, so a page that sets
 * `alternates` replaces the layout's — this keeps the RSS link alongside the
 * page's own canonical. Without it every page inherits the layout's canonical
 * and tells Google it's a duplicate of the homepage.
 */
export function pageAlternates(path: string) {
  return {
    canonical: path,
    types: { "application/rss+xml": "/rss.xml" },
  };
}
