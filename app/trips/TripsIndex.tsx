"use client";

import { useEffect, useState } from "react";
import Header from "../components/Header";
import LiveBanner from "./LiveBanner";
import PostItem from "../components/PostItem";
import LeafletOverviewMapLoader from "./LeafletOverviewMapLoader";
import type { TripEntry } from "@/lib/trips";

const MAP_VH = 55;

export default function TripsIndex({
  trips,
  isLive,
}: {
  trips: TripEntry[];
  isLive: boolean;
}) {
  const [hoveredTrip, setHoveredTrip] = useState<string | null>(null);

  useEffect(() => {
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        background: "var(--color-bg)",
        overflowY: "scroll",
      }}
    >
        {/* Banner in flow so it scrolls away with the content */}
        {isLive && <LiveBanner />}
        <Header variant="glass" topOffset={isLive ? 36 : 0} />

        {/* Map — directly below the in-flow header */}
        <div
          style={{
            width: "100%",
            height: `calc(${MAP_VH}vh)`,
            minHeight: 320,
          }}
        >
          <LeafletOverviewMapLoader trips={trips} hoveredTrip={hoveredTrip} />
        </div>

        {/* Past trips */}
        <div className="w-full max-w-[1080px] mx-auto px-4 md:px-8 pb-10">
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
              Past trips
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
                  excerpt={`${trip.region} · ${trip.stats} · ${trip.days}`}
                />
              </div>
            ))}
          </div>
        </div>
    </div>
  );
}
