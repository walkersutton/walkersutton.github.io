"use client";

import { useEffect, useState } from "react";
import { EMPTY_MAPSHARE_RESPONSE, type MapShareResponse } from "./mapshare";

const POLL_MS = 5 * 60 * 1000;

// Shared client-side poller for the live Garmin MapShare feed. Used by the
// full-screen live map (TripMap) and the home page trips hero so the fetch +
// interval logic lives in exactly one place.
export function useMapShare(): MapShareResponse {
  const [data, setData] = useState<MapShareResponse>(EMPTY_MAPSHARE_RESPONSE);

  useEffect(() => {
    let ignore = false;

    async function load() {
      try {
        const params = new URLSearchParams(window.location.search);
        const query = params.get("sample") === "1" ? "?sample=1" : "";
        const response = await fetch(`/api/mapshare${query}`, {
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

    return () => {
      ignore = true;
      window.clearInterval(interval);
    };
  }, []);

  return data;
}
