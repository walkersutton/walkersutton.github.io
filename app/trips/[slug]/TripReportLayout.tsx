"use client";

import Header from "../../components/Header";

// The glass header overlays this much of the map's top; the map is sized taller
// by the same amount so the visible map below the header stays ~60vh.
const HEADER_H = 71;

export default function TripReportLayout({
  map,
  children,
}: {
  map: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    // Full-bleed so the map runs edge to edge; flows in the normal page scroll so
    // the header scrolls away with the content (and the persistent banner in the
    // root layout never remounts when navigating in/out of this route).
    <div
      className="-mx-4 md:-mx-8"
      style={{ position: "relative", background: "var(--color-bg)" }}
    >
      {/* Glass header overlays the top of the map and scrolls away with the page */}
      <Header variant="glass" />

      {/* Map — sits behind the glass header */}
      <div
        style={{
          height: `calc(60vh + ${HEADER_H}px)`,
          minHeight: 340,
          maxHeight: 620,
        }}
      >
        {map}
      </div>

      {children}
    </div>
  );
}
