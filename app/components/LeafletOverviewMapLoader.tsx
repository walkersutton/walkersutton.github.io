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
  fitMinZoom,
  liveTrack,
  liveLatest,
}: {
  trips: TripEntry[];
  hoveredTrip?: string | null;
  fitMinZoom?: number;
  liveTrack?: [number, number][];
  liveLatest?: { lat: number; lng: number };
}) {
  return (
    <LeafletOverviewMap
      trips={trips}
      hoveredTrip={hoveredTrip}
      fitMinZoom={fitMinZoom}
      liveTrack={liveTrack}
      liveLatest={liveLatest}
    />
  );
}
