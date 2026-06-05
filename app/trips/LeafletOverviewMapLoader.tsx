"use client";

import dynamic from "next/dynamic";

const LeafletOverviewMap = dynamic(() => import("./LeafletOverviewMap"), {
  ssr: false,
  loading: () => (
    <div style={{ height: "100%", width: "100%", background: "var(--color-bg-sink)" }} />
  ),
});

type TripEntry = {
  name: string;
  region: string;
  date: string;
  href: string;
  coords: [number, number][];
};

export default function LeafletOverviewMapLoader({
  trips,
  hoveredTrip,
}: {
  trips: TripEntry[];
  hoveredTrip?: string | null;
}) {
  return <LeafletOverviewMap trips={trips} hoveredTrip={hoveredTrip} />;
}
