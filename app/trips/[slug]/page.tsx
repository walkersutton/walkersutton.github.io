import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReportTrack, ReportWaypoint } from "./LeafletReportMap";
import LeafletReportMapLoader from "./LeafletReportMapLoader";

type TripReport = {
  title: string;
  region: string;
  dates: string;
  dateStart: string;
  dateEnd: string;
  days: number;
  stats: { distance: string; gained: string; lost: string };
  tracks: ReportTrack[];
  waypoints: ReportWaypoint[];
  start: { lat: number; lng: number; name: string };
  prev?: { name: string; href: string; meta: string };
  next?: { name: string; href: string; meta: string };
};

const REPORTS: Record<string, TripReport> = {
  "olympic-peninsula-loop": {
    title: "Olympic Peninsula Loop",
    region: "Olympic National Park, WA",
    dates: "May 15–19, 2025",
    dateStart: "May 15",
    dateEnd: "May 19",
    days: 5,
    stats: { distance: "47 mi", gained: "13,240 ft", lost: "13,240 ft" },
    tracks: [
      { id: "day1", coords: [[47.454,-123.861],[47.491,-123.854],[47.523,-123.915],[47.556,-123.907],[47.589,-123.877],[47.608,-123.843]] },
      { id: "day2", coords: [[47.608,-123.843],[47.624,-123.815],[47.638,-123.782],[47.649,-123.754]] },
      { id: "day3", coords: [[47.649,-123.754],[47.671,-123.723],[47.688,-123.691],[47.698,-123.656],[47.701,-123.623]] },
      { id: "day4", coords: [[47.701,-123.623],[47.693,-123.659],[47.678,-123.697],[47.655,-123.731]] },
      { id: "day5", coords: [[47.655,-123.731],[47.621,-123.758],[47.581,-123.789],[47.531,-123.817],[47.490,-123.849],[47.454,-123.861]] },
    ],
    waypoints: [
      { lat: 47.608, lng: -123.843, name: "Enchanted Valley",  desc: "Camp 1. Elk everywhere.",               elev: "1,740 ft" },
      { lat: 47.649, lng: -123.754, name: "Anderson Pass",     desc: "High camp. Cold night, clear morning.", elev: "4,464 ft" },
      { lat: 47.701, lng: -123.623, name: "O'Neil Pass",       desc: "High point of the route.",             elev: "5,380 ft" },
      { lat: 47.655, lng: -123.731, name: "Lake Sundown",      desc: "Best camp. Jumped in.",                elev: "3,910 ft" },
    ],
    start: { lat: 47.454, lng: -123.861, name: "Quinault TH" },
    prev: { name: "PCT Section H", href: "#", meta: "Aug 2024 · 38 mi" },
    next: { name: "Enchanted Lakes Basin", href: "#", meta: "Jul 2024 · 22 mi" },
  },
};

export async function generateStaticParams() {
  return Object.keys(REPORTS).map((slug) => ({ slug }));
}

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await props.params;
  const trip = REPORTS[slug];
  if (!trip) return {};
  return { title: `${trip.title} | Walker Sutton` };
}

export default async function TripReportPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;
  const trip = REPORTS[slug];
  if (!trip) notFound();

  return (
    <main>
      {/* ── Back bar ── */}
      <div
        className="flex items-center"
        style={{ height: 42, borderBottom: "1px solid var(--color-border-faint)" }}
      >
        <div
          className="flex items-center justify-between w-full mx-auto"
          style={{ maxWidth: 720, padding: "0 28px" }}
        >
          <Link href="/trips" className="trip-back-link inline-flex items-center gap-[6px] text-[13px] font-medium no-underline transition-colors duration-150" style={{ color: "var(--color-text-variant)" }}>
            <span className="trip-back-arrow">←</span>
            Trips
          </Link>
          <span
            className="text-[11px] font-semibold uppercase tracking-[0.13em]"
            style={{ color: "var(--color-text-faint)" }}
          >
            Trip report
          </span>
        </div>
      </div>

      {/* ── Full-bleed map ── */}
      <div
        style={{
          width: "100vw",
          marginLeft: "calc(-50vw + 50%)",
          height: "60vh",
          minHeight: 340,
          maxHeight: 620,
          borderTop: "1px solid var(--color-rule)",
          borderBottom: "1px solid var(--color-rule)",
          position: "relative",
        }}
      >
        <LeafletReportMapLoader
          tracks={trip.tracks}
          waypoints={trip.waypoints}
          start={trip.start}
        />
      </div>

      {/* ── Content below map ── */}
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 28px 96px" }}>

        {/* Title */}
        <div
          className="text-[11px] font-semibold uppercase tracking-[0.13em]"
          style={{ color: "var(--color-text-faint)", marginTop: 32, marginBottom: 10 }}
        >
          Trip report
        </div>
        <h1
          className="font-semibold leading-[1.08] tracking-[-0.025em]"
          style={{
            fontSize: "clamp(28px,4vw,42px)",
            color: "var(--color-text)",
            marginBottom: 14,
            textWrap: "balance",
          } as React.CSSProperties}
        >
          {trip.title}.
        </h1>
        <div
          className="flex items-center flex-wrap gap-4 text-[14px]"
          style={{ color: "var(--color-text-faint)" }}
        >
          <span>{trip.dates}</span>
          <span className="w-[3px] h-[3px] rounded-full shrink-0" style={{ background: "var(--color-text-faint)" }} />
          <span>{trip.region}</span>
          <span className="w-[3px] h-[3px] rounded-full shrink-0" style={{ background: "var(--color-text-faint)" }} />
          <span>{trip.days} days</span>
        </div>

        {/* Stats strip */}
        <div
          className="grid mt-8"
          style={{
            gridTemplateColumns: "repeat(5, 1fr)",
            borderTop: "1px solid var(--color-rule)",
            borderBottom: "1px solid var(--color-border-faint)",
          }}
        >
          {[
            { lbl: "Distance", val: trip.stats.distance },
            { lbl: "Gained",   val: trip.stats.gained },
            { lbl: "Lost",     val: trip.stats.lost },
            { lbl: "Days",     val: String(trip.days) },
          ].map((s, i) => (
            <div
              key={s.lbl}
              style={{
                padding: "16px 0 16px 18px",
                borderLeft: i === 0 ? "none" : "1px solid var(--color-border-faint)",
                paddingLeft: i === 0 ? 0 : 18,
              }}
            >
              <div className="text-[10px] font-semibold uppercase tracking-[0.13em] mb-[5px]" style={{ color: "var(--color-text-faint)" }}>{s.lbl}</div>
              <div className="text-[18px] font-semibold tracking-[-0.02em] leading-[1.1]" style={{ color: "var(--color-text)" }}>{s.val}</div>
            </div>
          ))}
          <div style={{ padding: "16px 0 16px 18px", borderLeft: "1px solid var(--color-border-faint)" }}>
            <div className="text-[10px] font-semibold uppercase tracking-[0.13em] mb-[5px]" style={{ color: "var(--color-text-faint)" }}>Dates</div>
            <div className="text-[13px] font-medium leading-[1.3]" style={{ color: "var(--color-text-variant)" }}>
              {trip.dateStart}<br />{trip.dateEnd}
            </div>
          </div>
        </div>

        {/* Prose */}
        <div
          className="flex flex-col"
          style={{
            marginTop: 40,
            borderTop: "1px solid var(--color-border-faint)",
            paddingTop: 36,
          }}
        >
          <DayMarker label="Day 1" subtitle="Lake Quinault → Enchanted Valley" />
          <Paragraph>
            Drove out from New York on Thursday, slept in the car at the Quinault trailhead. The plan was a single big loop through the Olympics — no bailouts. Five days, 47 miles, whatever weather showed up.
          </Paragraph>
          <Paragraph>
            Day one felt easy. The kind of easy that tricks you. Flat river trail all the way to Enchanted Valley, the old patrol cabin visible from a mile out. A herd of elk was grazing in the meadow when I pulled in. Set up camp in the trees, ate dinner in the rain.
          </Paragraph>

          <DayMarker label="Day 2" subtitle="Enchanted Valley → Anderson Pass" />
          <Paragraph>
            The pass crossing on day two was where the trip turned. Anderson Pass sits at 4,464 feet and the trail above the lower switchbacks is unmaintained — loose rock, lingering snow, the kind of terrain that makes you check your footing twice. Worth every step. The view from the top is everything the Olympics promise.
          </Paragraph>

          <DayMarker label="Days 3–4" subtitle="O'Neil Pass · North Fork" />
          <Paragraph>
            Days three and four through the North Fork drainage were the quiet core of the trip. No other hikers. The trail crosses dozens of unnamed streams, some ankle-deep, some thigh-deep depending on snowmelt. My shoes never dried out. Didn't matter.
          </Paragraph>
          <Paragraph>
            Camped at a lake I couldn't find on the map on day four. Perfect water, perfect solitude. The kind of spot that makes the whole drive worth it.
          </Paragraph>

          <DayMarker label="Day 5" subtitle="Back to Quinault" />
          <Paragraph>
            Closed the loop in about six hours. Feet were wrecked but my head felt clear. The kind of tired that actually feels good.
          </Paragraph>

          {/* Waypoints */}
          <h3
            className="text-[13px] font-semibold uppercase tracking-[0.08em]"
            style={{ color: "var(--color-text-faint)", marginTop: 36, marginBottom: 12 }}
          >
            Waypoints
          </h3>
          {trip.waypoints.map((wpt) => (
            <div
              key={wpt.name}
              className="flex gap-[14px] items-baseline py-3"
              style={{ borderTop: "1px solid var(--color-border-faint)" }}
            >
              <div
                className="text-[13px] font-semibold tracking-[-0.01em] shrink-0"
                style={{ color: "var(--color-text)", minWidth: 140 }}
              >
                {wpt.name}
              </div>
              <div className="text-[13px]" style={{ color: "var(--color-text-faint)" }}>
                {wpt.desc}
              </div>
            </div>
          ))}
          <div style={{ borderTop: "1px solid var(--color-border-faint)" }} />
        </div>

        {/* Trip navigation */}
        <nav
          className="flex justify-between items-baseline gap-6"
          style={{
            marginTop: 56,
            paddingTop: 20,
            borderTop: "1px solid var(--color-rule)",
          }}
        >
          {trip.prev ? (
            <Link href={trip.prev.href} className="trip-nav-link flex flex-col gap-1 no-underline" style={{ maxWidth: "45%" }}>
              <div className="text-[11px] font-semibold uppercase tracking-[0.11em]" style={{ color: "var(--color-text-faint)" }}>← Previous</div>
              <div className="trip-nav-name text-[15px] font-semibold tracking-[-0.01em] transition-colors duration-150" style={{ color: "var(--color-text)" }}>{trip.prev.name}</div>
              <div className="text-[12px]" style={{ color: "var(--color-text-faint)" }}>{trip.prev.meta}</div>
            </Link>
          ) : <div />}
          {trip.next ? (
            <Link href={trip.next.href} className="trip-nav-link flex flex-col gap-1 no-underline items-end text-right" style={{ maxWidth: "45%" }}>
              <div className="text-[11px] font-semibold uppercase tracking-[0.11em]" style={{ color: "var(--color-text-faint)" }}>Next →</div>
              <div className="trip-nav-name text-[15px] font-semibold tracking-[-0.01em] transition-colors duration-150" style={{ color: "var(--color-text)" }}>{trip.next.name}</div>
              <div className="text-[12px]" style={{ color: "var(--color-text-faint)" }}>{trip.next.meta}</div>
            </Link>
          ) : <div />}
        </nav>

      </div>
    </main>
  );
}

// ── Prose helpers ──────────────────────────────────────────────────
function DayMarker({ label, subtitle }: { label: string; subtitle: string }) {
  return (
    <div
      className="inline-flex items-baseline gap-[10px] text-[11px] font-semibold uppercase tracking-[0.11em] mb-[10px]"
      style={{ color: "var(--color-text-faint)", marginTop: 36 }}
    >
      {label}
      <span className="text-[13px] font-semibold tracking-[-0.01em] normal-case" style={{ color: "var(--color-text)" }}>
        {subtitle}
      </span>
    </div>
  );
}

function Paragraph({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-[16px] leading-[1.7] mb-[22px]"
      style={{ color: "var(--color-text-variant)", maxWidth: "64ch" }}
    >
      {children}
    </p>
  );
}
