"use client";

import { useEffect, useState } from "react";
import { EMPTY_MAPSHARE_RESPONSE, type MapShareResponse } from "./mapshare";

const POLL_MS = 60 * 1000;

// Shared client-side poller for the live Garmin MapShare feed. Used by the
// full-screen live map (TripMap) and the home page trips hero so the fetch +
// interval logic lives in exactly one place.
//
// Pass `initialData` (fetched server-side, e.g. via getMapShareData()) to
// seed the first render with real data instead of EMPTY_MAPSHARE_RESPONSE —
// otherwise the UI flashes an empty/fallback state before the client's own
// fetch resolves.
export function useMapShare(initialData?: MapShareResponse): MapShareResponse {
  const [data, setData] = useState<MapShareResponse>(
    initialData ?? EMPTY_MAPSHARE_RESPONSE,
  );

  useEffect(() => {
    let ignore = false;

    async function load() {
      try {
        const params = new URLSearchParams(window.location.search);
        const query = new URLSearchParams();
        if (params.get("sample") === "1") query.set("sample", "1");
        // The edge cache keys on the full URL. Bucketing to the minute means
        // every viewer in a given minute shares one cache entry (so Garmin
        // still sees ~1 request/min no matter how many people are watching),
        // while the key rotating each minute stops a shared proxy from
        // pinning us to a position that's older than that.
        query.set("t", String(Math.floor(Date.now() / POLL_MS)));
        const response = await fetch(`/api/mapshare?${query}`, {
          cache: "no-store",
        });
        const payload = (await response.json()) as MapShareResponse;
        if (!ignore && response.ok) setData(payload);
      } catch {
        // Keep the last-known track if the feed is temporarily unavailable.
      }
    }

    load();
    const interval = window.setInterval(load, POLL_MS);
    // A phone that slept through several intervals should catch up the moment
    // the tab is looked at again, rather than waiting out the next tick.
    function onVisible() {
      if (document.visibilityState === "visible") load();
    }
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      ignore = true;
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return data;
}
