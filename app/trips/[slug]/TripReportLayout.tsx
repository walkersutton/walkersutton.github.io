"use client";

import { useEffect } from "react";
import Header from "../../components/Header";
import LiveBanner from "../LiveBanner";

const HEADER_H = 71;

export default function TripReportLayout({
  map,
  children,
  isLive,
}: {
  map: React.ReactNode;
  children: React.ReactNode;
  isLive?: boolean;
}) {
  const totalTopOffset = HEADER_H;

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, background: "var(--color-bg)" }}>
      {/* Single scroll container — banner, header, and map all live in flow here
          so they scroll away with the content instead of staying pinned. */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          overflowY: "auto",
          scrollbarWidth: "none",
        }}
      >
        {/* Banner in flow so it scrolls away with the content */}
        {isLive && <LiveBanner />}
        <Header variant="glass" topOffset={isLive ? 36 : 0} />

        {/* Map — starts at top:0, sits behind glass header + banner */}
        <div style={{ height: `calc(60vh + ${totalTopOffset}px)`, minHeight: 340, maxHeight: 620 }}>
          {map}
        </div>

        {children}
      </div>
    </div>
  );
}
