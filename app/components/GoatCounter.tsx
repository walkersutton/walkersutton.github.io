"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    goatcounter?: {
      count?: (vars: { path?: string; title?: string; referrer?: string }) => void;
    };
  }
}

// Routes that are the site owner's own tooling rather than pages anyone visits.
// Nothing under these is reported, and count.js is not even loaded while one is
// on screen.
const UNTRACKED_PREFIXES = ["/admin"];

function isTracked(pathname: string): boolean {
  return !UNTRACKED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/**
 * count.js records a pageview when it loads and never again. Every in-site
 * navigation goes through next/link, which swaps the page client-side without
 * reloading the document — so only the page a visitor first landed on was ever
 * counted, and the stats collapsed onto whichever URLs people enter the site
 * through. This reports the ones the script cannot see.
 *
 * Because that load-time pageview is not something we can suppress after the
 * fact, the script is withheld until the visitor is actually on a tracked page:
 * landing straight on /admin has to leave count.js unloaded, or it counts the
 * admin page before any of our code runs.
 */
export default function GoatCounter() {
  const pathname = usePathname();

  // Flips to true the first time a tracked page is on screen and never back, so
  // the script tag is mounted once and stays mounted. Whichever page is current
  // at that moment is the one count.js counts on load.
  const [loaded, setLoaded] = useState(() => isTracked(pathname));

  // The last path handed to GoatCounter, by count.js on load or by us since.
  // Seeded with the page count.js will count itself, so that entry pageview is
  // not recorded a second time.
  const lastPath = useRef<string | null>(isTracked(pathname) ? pathname : null);

  useEffect(() => {
    if (!loaded) {
      // Still on an untracked page: nothing has been counted yet, and the
      // script stays off until a tracked page comes up.
      if (isTracked(pathname)) {
        lastPath.current = pathname;
        setLoaded(true);
      }
      return;
    }

    if (lastPath.current === pathname) return;
    lastPath.current = pathname;
    if (!isTracked(pathname)) return;

    // Read the live location rather than rebuilding it: this keeps the query
    // string without pulling in useSearchParams, which would demand a Suspense
    // boundary around the whole layout and opt static pages into dynamic
    // rendering.
    const path = window.location.pathname + window.location.search;

    // count.js is loaded async, so on a fast early navigation it may not be
    // ready yet. Wait briefly rather than dropping the pageview outright.
    let attempts = 0;
    const send = (): boolean => {
      if (typeof window.goatcounter?.count !== "function") return false;
      window.goatcounter.count({ path });
      return true;
    };
    if (send()) return;

    const timer = window.setInterval(() => {
      attempts += 1;
      if (send() || attempts > 20) window.clearInterval(timer);
    }, 250);

    return () => window.clearInterval(timer);
  }, [pathname, loaded]);

  if (!loaded) return null;

  return (
    <Script
      async
      data-goatcounter="https://walker.goatcounter.com/count"
      src="//gc.zgo.at/count.js"
    />
  );
}
