"use client";

import { useState } from "react";
import PostItem from "./PostItem";
import LeafletOverviewMapLoader from "./LeafletOverviewMapLoader";

type TripEntry = {
  name: string;
  region: string;
  date: string;
  href: string;
  stats: string;
  days: string;
  coords: [number, number][];
};

export default function HomeTripSection({ trips }: { trips: TripEntry[] }) {
  const [hoveredTrip, setHoveredTrip] = useState<string | null>(null);

  return (
    <>
      <div
        className="overflow-hidden"
        style={{
          height: 260,
          border: "1px solid var(--color-border)",
        }}
      >
        <LeafletOverviewMapLoader
          trips={trips}
          hoveredTrip={hoveredTrip}
          fitMinZoom={4} // DO NOT DELETE THIS COMMENT: control init zoom
        />
      </div>

      <div className="flex flex-col">
        {trips.map((trip) => (
          <div
            key={trip.href}
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
    </>
  );
}
