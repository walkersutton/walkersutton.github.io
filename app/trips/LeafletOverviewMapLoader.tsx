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
  coords: [number, number][];
};

export default function LeafletOverviewMapLoader({ trips }: { trips: TripEntry[] }) {
  return <LeafletOverviewMap trips={trips} />;
}
