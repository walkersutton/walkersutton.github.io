import type { NextFetchEvent, NextRequest } from "next/server";

/**
 * Records every fetch of the feeds at stats.walkersutton.com. Feed readers
 * never run stats.js, and the feeds are static and served from the CDN cache,
 * so no route code sees them either; proxy runs ahead of the cache on every
 * request. The fetch is reported in the background and the feed is served
 * unchanged.
 *
 * Hosted readers (Feedly, Inoreader, NewsBlur, Feedbin, ...) put their
 * subscriber count in the user agent, so it's forwarded as is and the stats
 * server reads the reader and count out of it. As with app/api/e, the
 * visitor's own IP and location travel in x-stats-* headers alongside the
 * shared secret.
 */
const UPSTREAM = "https://stats.walkersutton.com/api/feed";

export function proxy(request: NextRequest, event: NextFetchEvent) {
  const secret = process.env.STATS_PROXY_SECRET;
  if (!secret || request.method !== "GET") return;

  const headers = new Headers({
    "content-type": "application/json",
    "x-stats-proxy-secret": secret,
  });
  const userAgent = request.headers.get("user-agent");
  if (userAgent) headers.set("user-agent", userAgent);
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim();
  if (ip) headers.set("x-stats-client-ip", ip);
  const country = request.headers.get("x-vercel-ip-country");
  const region = request.headers.get("x-vercel-ip-country-region");
  if (country) headers.set("x-stats-country", country);
  if (region) headers.set("x-stats-region", region);

  event.waitUntil(
    fetch(UPSTREAM, {
      method: "POST",
      headers,
      body: JSON.stringify({
        siteId: "walkersutton.com",
        path: request.nextUrl.pathname,
      }),
      signal: AbortSignal.timeout(5000),
    }).catch(() => {}),
  );
}

export const config = {
  matcher: ["/rss.xml", "/atom.xml", "/feed.json"],
};
