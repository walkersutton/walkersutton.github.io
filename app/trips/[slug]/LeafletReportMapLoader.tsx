"use client";

import dynamic from "next/dynamic";
import type { ReportTrack, ReportWaypoint } from "./LeafletReportMap";

const LeafletReportMap = dynamic(() => import("./LeafletReportMap"), {
  ssr: false,
  loading: () => (
    <div style={{ height: "100%", width: "100%", background: "var(--color-bg-sink)" }} />
  ),
});

type Props = {
  tracks: ReportTrack[];
  waypoints: ReportWaypoint[];
  start: { lat: number; lng: number; name: string };
};

export default function LeafletReportMapLoader(props: Props) {
  return <LeafletReportMap {...props} />;
}
