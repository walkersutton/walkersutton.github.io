"use client";

import Link from "next/link";
import { useMemo } from "react";
import LeafletOverviewMapLoader from "./LeafletOverviewMapLoader";
import { useMapShare } from "../trips/useMapShare";
import { formatUpdated, type MapShareResponse } from "../trips/mapshare";
import type { TripEntry } from "@/lib/trips";

// Height of the persistent glass header (h-[70px] row + 1px bottom border). The
// hero map is pulled up by this amount so it sits *behind* the translucent
// header (glass on the home page while live), matching the /trips overlay.
const HEADER_H = 71;

// The full-bleed /trips overview map, reused as the home page hero while a trip
// is live — the current trip's track is overlaid and the map frames it, with
// past trips dimmed behind it for context.
export default function HomeTripsHero({
  trips,
  activeTripName,
  initialMapShare,
}: {
  trips: TripEntry[];
  activeTripName: string;
  initialMapShare?: MapShareResponse;
}) {
  const data = useMapShare(initialMapShare);
  const liveTrack = useMemo(
    () =>
      data.tracks.flatMap((track) =>
        track.coordinates.map(
          (point) => [point.lat, point.lng] as [number, number],
        ),
      ),
    [data],
  );
  const tripName = data.tracks[0]?.name ?? activeTripName;
  const updated = formatUpdated(data.latestPoint?.time);

  return (
    <div
      className="-mx-4 md:-mx-8 relative"
      style={{ background: "var(--color-bg)", marginTop: -HEADER_H }}
    >
      {/* Map runs up behind the persistent sticky layout header, which goes
          glass on the home page while live (see Header autoGlass) and overlays
          the map. */}
      <div
        style={{
          width: "100%",
          height: `calc(min(52vh, 520px) + ${HEADER_H}px)`,
          minHeight: 300 + HEADER_H,
        }}
      >
        <LeafletOverviewMapLoader
          trips={trips}
          liveTrack={liveTrack}
          liveLatest={data.latestPoint}
        />
      </div>

      {/* Live identity + CTA, glass card pinned to the map's lower-left */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className="pointer-events-auto absolute bottom-4 left-4 md:bottom-5 md:left-5 flex flex-col gap-3 p-4 sm:p-5 max-w-[min(300px,calc(100%-32px))]"
          style={{
            background: "rgba(var(--header-glass-rgb), 0.86)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            border: "1px solid var(--color-border-faint)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.09)",
          }}
        >
          <div>
            <div
              className="mb-2 inline-flex items-center gap-[6px] text-[10.5px] font-semibold uppercase tracking-[0.13em]"
              style={{ color: "var(--accent-green)" }}
            >
              <span className="trips-live-dot" />
              Live
            </div>
            <h2
              className="m-0 text-[20px] font-semibold leading-[1.1] tracking-[-0.025em]"
              style={{ color: "var(--color-text)" }}
            >
              {tripName}
            </h2>
            {updated && (
              <div
                className="mt-2 text-[12px]"
                style={{ color: "var(--color-text-faint)" }}
              >
                {updated}
              </div>
            )}
          </div>

          <Link
            href="/trips/live"
            className="inline-flex min-h-9 items-center justify-center bg-[var(--color-text)] px-4 text-[12px] font-semibold no-underline transition-opacity hover:opacity-85"
            style={{ color: "var(--color-bg)" }}
          >
            Live tracker&nbsp; →
          </Link>
        </div>
      </div>
    </div>
  );
}
