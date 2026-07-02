"use client";

import { useState } from "react";
import Footer from "../components/Footer";
import PostItem from "../components/PostItem";
import LeafletOverviewMapLoader from "@/app/components/LeafletOverviewMapLoader";
import type { TripEntry } from "@/lib/trips";

const MAP_VH = 55;
// Height of the persistent glass header (h-[70px] row + 1px bottom border). The
// map is pulled up by this amount so it sits *behind* the translucent header,
// letting the glass overlay the map from the top instead of starting below it.
const HEADER_H = 71;

export default function TripsIndex({ trips }: { trips: TripEntry[] }) {
  const [hoveredTrip, setHoveredTrip] = useState<string | null>(null);

  return (
    // Full-bleed so the map runs edge to edge; flows in the normal page scroll
    // (the persistent banner + header live in the root layout / here and scroll
    // away naturally instead of being pinned by a fixed full-viewport scroller).
    // Pulled up behind the sticky glass header so it overlays the map.
    <div
      className="-mx-4 md:-mx-8"
      style={{ position: "relative", background: "var(--color-bg)", marginTop: -HEADER_H }}
    >
      {/* Map — runs up behind the sticky glass layout header */}
      <div
        style={{
          width: "100%",
          height: `calc(${MAP_VH}vh + ${HEADER_H}px)`,
          minHeight: 320 + HEADER_H,
        }}
      >
        <LeafletOverviewMapLoader trips={trips} hoveredTrip={hoveredTrip} />
      </div>

      {/* Past trips */}
      <div className="w-full max-w-[820px] mx-auto px-4 md:px-8 pb-10">
        <div
          className="flex items-baseline justify-between pb-3"
          style={{
            marginTop: 44,
            borderBottom: "1.5px solid var(--color-text)",
          }}
        >
          <span
            className="text-[13px] font-semibold tracking-[0.01em]"
            style={{ color: "var(--color-text)" }}
          >
            Trip Reports
          </span>
          <span
            className="text-[12px] font-semibold"
            style={{ color: "var(--accent)" }}
          >
            {trips.length}
          </span>
        </div>

        <div className="flex flex-col">
          {trips.map((trip) => (
            <div
              key={trip.name}
              onMouseEnter={() => setHoveredTrip(trip.name)}
              onMouseLeave={() => setHoveredTrip(null)}
            >
              <PostItem
                title={trip.name}
                href={trip.href}
                date={trip.date}
                excerpt={`${trip.region} · ${trip.stats}`}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 md:px-8">
        <Footer />
      </div>
    </div>
  );
}
