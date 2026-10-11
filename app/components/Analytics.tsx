"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

// Routes that are the site owner's own tooling rather than pages anyone visits.
const UNTRACKED_PREFIXES = ["/admin"];

function isTracked(pathname: string): boolean {
  return !UNTRACKED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/**
 * Pageviews go to the self-hosted stats at stats.walkersutton.com. stats.js
 * counts the page it loads on and then every client-side navigation itself (it
 * wraps history.pushState), so all this component decides is when to load it.
 *
 * It is withheld until the visitor is on a tracked page: landing straight on
 * /admin has to leave stats.js unloaded, or that page is counted on load.
 * Moving from a public page into /admin is still seen by stats.js — the
 * owner's own visits are dropped server-side by its ignored-IP rules.
 */
export default function Analytics() {
  const pathname = usePathname();

  // Flips to true the first time a tracked page is on screen and never back, so
  // the script tag is mounted once and stays mounted.
  const [loaded, setLoaded] = useState(() => isTracked(pathname));

  useEffect(() => {
    if (!loaded && isTracked(pathname)) setLoaded(true);
  }, [pathname, loaded]);

  if (!loaded) return null;

  return (
    <Script
      src="https://stats.walkersutton.com/stats.js"
      data-site-id="walkersutton.com"
      strategy="afterInteractive"
    />
  );
}
