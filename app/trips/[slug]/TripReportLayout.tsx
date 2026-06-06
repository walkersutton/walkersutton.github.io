"use client";

import Footer from "../../components/Footer";

// Height of the persistent glass header (h-[70px] row + 1px bottom border). The
// map is pulled up by this amount so it sits *behind* the translucent header,
// letting the glass overlay the map from the top instead of starting below it.
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
      style={{ position: "relative", background: "var(--color-bg)", marginTop: -HEADER_H }}
    >
      {/* Map — runs up behind the sticky glass layout header */}
      <div
        style={{
          height: `calc(60vh + ${HEADER_H}px)`,
          minHeight: 340 + HEADER_H,
          maxHeight: 620 + HEADER_H,
        }}
      >
        {map}
      </div>

      {children}

      <div className="px-4 md:px-8">
        <Footer />
      </div>
    </div>
  );
}
