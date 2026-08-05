"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

declare global {
  interface Window {
    goatcounter?: {
      count?: (vars: { path?: string; title?: string; referrer?: string }) => void;
    };
  }
}

/**
 * count.js records a pageview when it loads and never again. Every in-site
 * navigation goes through next/link, which swaps the page client-side without
 * reloading the document — so only the page a visitor first landed on was ever
 * counted, and the stats collapsed onto whichever URLs people enter the site
 * through. This reports the ones the script cannot see.
 */
export default function GoatCounterRouteTracker() {
  const pathname = usePathname();

  // The first pathname this sees is the page count.js already counted on load.
  // Recording it again would double every entry pageview, so it is only ever
  // used as the baseline to compare against.
  const counted = useRef<string | null>(null);

  useEffect(() => {
    if (counted.current === null) {
      counted.current = pathname;
      return;
    }
    if (counted.current === pathname) return;
    counted.current = pathname;

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
  }, [pathname]);

  return null;
}
