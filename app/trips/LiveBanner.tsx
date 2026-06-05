"use client";

import Link from "next/link";

const SEGMENT = "  ·  Walker is currently on trail  ·  View live route ↗  ·  ";
const TICKER_DURATION_MS = 150_000;

export default function LiveBanner() {
  const text = SEGMENT.repeat(6);

  // The banner is rendered in two DOM locations — the global layout (normal
  // pages) and inside the per-route trips scroll containers — so navigating
  // across the /trips boundary remounts it. A fresh mount would restart the
  // marquee at position 0. Seeding a time-based negative animation-delay makes
  // every mount pick up at the same phase a continuously-running ticker would
  // be at, so the scroll position stays seamless across navigation.
  const animationDelay =
    typeof window === "undefined"
      ? "0ms"
      : `-${Date.now() % TICKER_DURATION_MS}ms`;

  return (
    <Link
      href="/trips/live"
      style={{ textDecoration: "none", display: "block", overflow: "hidden" }}
    >
      <div
        style={{
          background: "var(--color-text)",
          color: "var(--color-bg)",
          height: 36,
          display: "flex",
          alignItems: "center",
          cursor: "pointer",
          userSelect: "none",
        }}
      >
        {/* Duplicated so the loop is seamless */}
        <div
          suppressHydrationWarning
          style={{
            display: "inline-flex",
            whiteSpace: "nowrap",
            animation: "live-ticker 150s linear infinite",
            animationDelay,
          }}
        >
          {[0, 1].map((i) => (
            <span
              key={i}
              className="text-[11px] font-semibold uppercase tracking-[0.13em]"
              style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
            >
              <span className="trips-live-dot" />
              LIVE
              {text}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}
