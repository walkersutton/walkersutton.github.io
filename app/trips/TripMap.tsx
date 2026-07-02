"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo } from "react";
import PostItem from "../components/PostItem";
import type { TripEntry } from "@/lib/trips";
import { useMapShare } from "./useMapShare";
import {
  computeMapShareStats,
  formatElapsed,
  formatElevationFeet,
  formatFeet,
  formatMiles,
  formatUpdated,
  type MapPoint,
  type MapShareResponse,
} from "./mapshare";

const LeafletTripMap = dynamic(() => import("./LeafletTripMap"), {
  ssr: false,
  loading: () => (
    <div
      className="flex h-full w-full items-center justify-center text-[13px]"
      style={{
        background: "var(--color-bg-sink)",
        color: "var(--color-text-faint)",
      }}
    >
      Loading map
    </div>
  ),
});

function fmtCoord(p?: MapPoint) {
  if (!p) return "—";
  return `${Math.abs(p.lat).toFixed(5)}°${p.lat >= 0 ? "N" : "S"},  ${Math.abs(p.lng).toFixed(5)}°${p.lng >= 0 ? "E" : "W"}`;
}
// ── Sub-components ────────────────────────────────────────────────
function Lbl({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="text-[10.5px] font-semibold uppercase tracking-[0.13em] mb-1"
      style={{ color: "var(--color-text-faint)" }}
    >
      {children}
    </div>
  );
}

function Val({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="text-[19px] font-semibold tracking-[-0.022em] leading-[1.1]"
      style={{ color: "var(--color-text)" }}
    >
      {children}
    </div>
  );
}

function StatsPanel({
  data,
  stats,
  trips,
  isOnTrip,
  activeTripName,
}: {
  data: MapShareResponse;
  stats: ReturnType<typeof computeMapShareStats>;
  trips: TripEntry[];
  isOnTrip: boolean;
  activeTripName: string;
}) {
  const tripName =
    data.tracks[0]?.name ?? (data.sample ? "Sample Track" : activeTripName);
  const updatedText = formatUpdated(data.latestPoint?.time);
  const latestDesc =
    data.latestPoint?.description ?? data.points[0]?.description;
  const sectionStyle = {
    borderColor: "var(--color-border-faint)",
    padding: "16px 18px",
  };

  return (
    <>
      {/* Identity */}
      <div
        style={{
          ...sectionStyle,
          borderBottom: "1px solid var(--color-border-faint)",
        }}
      >
        {isOnTrip && (
          <div
            className="inline-flex items-center gap-[6px] text-[10.5px] font-semibold uppercase tracking-[0.13em] mb-[6px]"
            style={{ color: "var(--accent-green)" }}
          >
            <span className="trips-live-dot" />
            Live
          </div>
        )}
        <div
          className="text-[20px] font-semibold tracking-[-0.02em] leading-[1.1] mb-[3px]"
          style={{ color: "var(--color-text)" }}
        >
          {tripName}
        </div>
        {updatedText && (
          <div
            className="text-[12px] mt-[2px]"
            style={{ color: "var(--color-text-faint)" }}
          >
            {updatedText}
          </div>
        )}
      </div>

      {/* Stats */}
      <div style={sectionStyle}>
        <div
          className="grid gap-x-[10px] gap-y-[14px]"
          style={{
            gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
          }}
        >
          <div>
            <Lbl>Distance</Lbl>
            <Val>{formatMiles(stats.distMi)}</Val>
          </div>
          <div>
            <Lbl>Elevation</Lbl>
            <Val>{formatElevationFeet(data.latestPoint?.elevation)}</Val>
          </div>
          <div>
            <Lbl>Gained</Lbl>
            <Val>{formatFeet(stats.gainFt)}</Val>
          </div>
          <div>
            <Lbl>Lost</Lbl>
            <Val>{formatFeet(stats.lossFt)}</Val>
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <Lbl>Elapsed</Lbl>
            <Val>{formatElapsed(stats.elapsedMs)}</Val>
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <Lbl>Coordinates</Lbl>
            <div
              className="text-[12.5px] font-medium leading-[1.55]"
              style={{ color: "var(--color-text-variant)" }}
            >
              {fmtCoord(data.latestPoint)}
            </div>
          </div>
        </div>
      </div>

      {/* Latest check-in */}
      {(latestDesc || data.totalPoints === 0) && (
        <div style={sectionStyle}>
          <Lbl>Latest check-in</Lbl>
          <div
            className="text-[13px] leading-[1.55] mt-[7px]"
            style={{
              padding: "9px 12px",
              background: "var(--color-bg-sink)",
              borderLeft: "2.5px solid var(--color-text)",
              color: "var(--color-text-variant)",
            }}
          >
            {latestDesc ?? "No messages yet."}
          </div>
        </div>
      )}

      {/* Past trips */}
      <div style={{ ...sectionStyle, borderBottom: "none" }}>
        <Lbl>Trip Reports</Lbl>
        <div className="mt-[10px] flex flex-col">
          {trips.slice(0, 2).map((trip) => (
            <PostItem
              key={trip.name}
              title={trip.name}
              href={trip.href}
              date={trip.date}
              excerpt={trip.stats}
            />
          ))}
        </div>
        <Link
          href="/trips"
          className="text-[12px] font-medium mt-[10px] inline-block"
          style={{
            color: "var(--color-text-faint)",
            textDecoration: "underline",
            textUnderlineOffset: "2px",
          }}
        >
          View all trips
        </Link>
      </div>
    </>
  );
}

// ── Main component ────────────────────────────────────────────────
export default function TripMap({
  trips,
  isOnTrip = false,
  activeTripName = "Active Trip",
}: {
  trips: TripEntry[];
  isOnTrip?: boolean;
  activeTripName?: string;
}) {
  const data = useMapShare();

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const stats = useMemo(() => computeMapShareStats(data), [data]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        background: "var(--color-bg-sink)",
      }}
    >
      {/* No header here — the persistent layout header (auto-glass on /trips)
          sits above this overlay (z-55 > z-50), staying a single instance so
          the crossbones <g> survives navigation to/from the live map. */}

      {/* Full-bleed map */}
      <div style={{ position: "absolute", inset: 0 }}>
        <LeafletTripMap
          tracks={data.tracks}
          points={data.points}
          latestPoint={data.latestPoint}
          zoomPosition="topright"
        />
      </div>

      {/* Glass overlay card — bottom sheet on mobile, side card on desktop */}
      <div
        className="absolute overflow-y-auto
          bottom-0 left-0 right-0 max-h-[45vh]
          sm:bottom-auto sm:right-auto sm:top-[85px] sm:left-[20px] sm:w-[272px] sm:max-h-[calc(100vh-71px-28px)]"
        style={{
          background: "rgba(var(--header-glass-rgb), 0.86)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          border: "1px solid var(--color-border-faint)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.09)",
          scrollbarWidth: "none",
          zIndex: 10,
        }}
      >
        <StatsPanel
          data={data}
          stats={stats}
          trips={trips}
          isOnTrip={isOnTrip}
          activeTripName={activeTripName}
        />
      </div>
    </div>
  );
}
