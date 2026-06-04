import Link from "next/link";
import PostItem from "../components/PostItem";
import LeafletOverviewMapLoader from "./LeafletOverviewMapLoader";

export type TripEntry = {
  name: string;
  region: string;
  stats: string;
  days: string;
  date: string;
  href: string;
  coords: [number, number][];
};

export const TRIPS: TripEntry[] = [
  {
    name: "Olympic Peninsula Loop",
    region: "Olympic National Park, WA",
    stats: "47 mi · 13,240 ft",
    days: "5 days",
    date: "2025-05-01",
    href: "/trips/olympic-peninsula-loop",
    coords: [
      [47.454, -123.861],
      [47.491, -123.854],
      [47.523, -123.915],
      [47.556, -123.907],
      [47.589, -123.877],
      [47.608, -123.843],
      [47.624, -123.815],
      [47.638, -123.782],
      [47.649, -123.754],
      [47.671, -123.723],
      [47.688, -123.691],
      [47.698, -123.656],
      [47.701, -123.623],
      [47.693, -123.659],
      [47.678, -123.697],
      [47.655, -123.731],
      [47.621, -123.758],
      [47.581, -123.789],
      [47.531, -123.817],
      [47.49, -123.849],
      [47.454, -123.861],
    ],
  },
  {
    name: "PCT Section H",
    region: "Glacier Peak Wilderness, WA",
    stats: "38 mi · 9,800 ft",
    days: "4 days",
    date: "2024-08-01",
    href: "#",
    coords: [
      [48.098, -121.398],
      [48.074, -121.362],
      [48.045, -121.331],
      [48.019, -121.298],
      [47.997, -121.268],
      [47.971, -121.241],
      [47.942, -121.214],
      [47.916, -121.183],
      [47.886, -121.152],
      [47.854, -121.124],
    ],
  },
  {
    name: "Enchanted Lakes Basin",
    region: "Alpine Lakes Wilderness, WA",
    stats: "22 mi · 7,100 ft",
    days: "3 days",
    date: "2024-07-01",
    href: "#",
    coords: [
      [47.508, -120.825],
      [47.513, -120.802],
      [47.521, -120.779],
      [47.532, -120.754],
      [47.541, -120.731],
      [47.549, -120.708],
      [47.542, -120.683],
      [47.53, -120.661],
      [47.515, -120.643],
    ],
  },
];

export default function TripsIndex() {
  return (
    <main className="w-full max-w-[1080px] mx-auto pb-2">
      {/* ── Hero ── */}
      {/* <section style={{ paddingTop: 44, maxWidth: 820 }}>
        <div
          className="text-[13px] font-medium"
          style={{ color: "var(--color-text-variant)", marginBottom: 18 }}
        >
          Backpacking updates
        </div>
        <h1
          className="font-bold leading-[1.16] tracking-[-0.025em]"
          style={{
            fontSize: "clamp(26px,4vw,44px)",
            color: "var(--color-text)",
            marginBottom: 14,
          }}
        >
          Trips.
        </h1>
        <div
          className="inline-flex items-center gap-[7px] text-[13.5px]"
          style={{ color: "var(--color-text-faint)", marginBottom: 36 }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: "var(--color-text-faint)",
              flexShrink: 0,
              display: "inline-block",
            }}
          />
          No active trip right now.
        </div>
      </section> */}

      {/* ── Full-bleed overview map ── */}
      <div
        style={{
          width: "100vw",
          marginLeft: "calc(-50vw + 50%)",
          height: "38vh",
          minHeight: 260,
          maxHeight: 440,
        }}
      >
        <LeafletOverviewMapLoader trips={TRIPS} />
      </div>

      {/* ── Past trips ── */}
      <div>
        {/* Section bar */}
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
            {TRIPS.length}
          </span>
        </div>

        {/* Trip rows */}
        <div className="flex flex-col">
          {TRIPS.map((trip) => (
            <PostItem
              key={trip.name}
              title={trip.name}
              href={trip.href}
              date={trip.date}
              excerpt={`${trip.region} · ${trip.stats} · ${trip.days}`}
            />
          ))}
        </div>

        {/* Footer nudge */}
        {/* <div
          className="mt-3"
          style={{
            borderTop: "1px solid var(--color-rule)",
            padding: "56px 0 72px",
          }}
        >
          <div
            className="font-semibold tracking-[-0.02em] leading-[1.2]"
            style={{
              fontSize: "clamp(20px,2.5vw,28px)",
              color: "var(--color-text)",
            }}
          >
            Next trip not yet planned.
          </div>
          <div
            className="mt-[10px] text-[13px]"
            style={{ color: "var(--color-text-faint)" }}
          >
            Check back when something's in the works.
          </div>
        </div> */}
      </div>
    </main>
  );
}
