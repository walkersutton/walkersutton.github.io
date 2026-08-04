import type { Metadata } from "next";
import Link from "next/link";
import { draftMode } from "next/headers";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import {
  getAllTripSlugs,
  getTripBySlug,
  buildTripEntries,
  fmtMiles,
  fmtFeet,
} from "@/lib/trips";
import type { TripEntry, DayStat } from "@/lib/trips";
import Gallery from "@/app/components/Gallery";
import ProseImage from "@/app/components/ProseImage";
import LeafletReportMapLoader from "./LeafletReportMapLoader";
import TripReportLayout from "./TripReportLayout";

export async function generateStaticParams() {
  return getAllTripSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await props.params;
  const trip = getTripBySlug(slug);
  if (!trip) return {};
  return { title: `${trip.frontmatter.title} | Walker Sutton` };
}

function fmtNavMeta(entry: TripEntry): string {
  const d = new Date(entry.date + "T12:00:00");
  const month = d.toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
  const dist = entry.stats.split(" · ")[0];
  return `${month} · ${dist}`;
}

export default async function TripReportPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;
  const trip = getTripBySlug(slug);
  if (!trip) notFound();

  const { isEnabled: showDrafts } = await draftMode();
  if (trip.frontmatter.draft && !showDrafts) notFound();

  const {
    frontmatter: fm,
    tracks,
    waypoints,
    start,
    stats,
    dayStats,
    stravaByLabel,
    dates,
    content,
  } = trip;

  // Prev/next from sorted trip list (desc by date — prev = older, next = newer)
  const allEntries = buildTripEntries({ includeDrafts: showDrafts });
  const idx = allEntries.findIndex((e) => e.href === `/trips/${slug}`);
  const prevEntry = idx < allEntries.length - 1 ? allEntries[idx + 1] : null;
  const nextEntry = idx > 0 ? allEntries[idx - 1] : null;

  return (
    <TripReportLayout
      map={
        start ? (
          <LeafletReportMapLoader
            tracks={tracks}
            waypoints={waypoints}
            start={start}
          />
        ) : null
      }
    >
      {/* ── Content below map ── */}
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 28px 96px" }}>
        {/* Title */}
        <div
          className="text-[11px] font-semibold uppercase tracking-[0.13em]"
          style={{
            color: "var(--color-text-variant)",
            marginTop: 32,
            marginBottom: 10,
          }}
        >
          Trip report
        </div>
        <h1
          className="font-semibold leading-[1.08] tracking-[-0.025em]"
          style={
            {
              fontSize: "clamp(28px,4vw,42px)",
              color: "var(--color-text)",
              marginBottom: 14,
              textWrap: "balance",
            } as React.CSSProperties
          }
        >
          {fm.title}
        </h1>
        <div
          className="flex items-center flex-wrap gap-4 text-[14px]"
          style={{ color: "var(--color-text-variant)" }}
        >
          <span>{dates}</span>
          <span
            className="w-[3px] h-[3px] rounded-full shrink-0"
            style={{ background: "var(--color-text-variant)" }}
          />
          <span>{fm.region}</span>
        </div>

        {/* Stats strip */}
        <div className="flex gap-10 mt-6">
          {[
            { lbl: "Distance", val: stats.distance },
            { lbl: "Gained", val: stats.gained },
            { lbl: "Lost", val: stats.lost },
          ].map((s) => (
            <div key={s.lbl}>
              <div
                className="text-[10px] font-semibold uppercase tracking-[0.13em] mb-[5px]"
                style={{ color: "var(--color-text-variant)" }}
              >
                {s.lbl}
              </div>
              <div
                className="text-[18px] font-semibold tracking-[-0.02em] leading-[1.1]"
                style={{ color: "var(--color-text)" }}
              >
                {s.val}
              </div>
            </div>
          ))}
        </div>

        {/* Prose */}
        <div
          className="flex flex-col"
          style={{ marginTop: 52 }}
        >
          <MDXRemote
            source={content}
            components={{
              DayMarker: makeDayMarker(dayStats, stravaByLabel),
              p: Paragraph,
              Img: ProseImage,
              img: ProseImage,
              Gallery,
            }}
          />

          {/* Waypoints */}
          {waypoints.length > 0 && (
            <>
              <h3
                className="text-[13px] font-semibold uppercase tracking-[0.08em]"
                style={{
                  color: "var(--color-text-variant)",
                  marginTop: 36,
                  marginBottom: 12,
                }}
              >
                Waypoints
              </h3>
              {waypoints.map((wpt) => (
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
                  <div
                    className="text-[13px]"
                    style={{ color: "var(--color-text-variant)" }}
                  >
                    {wpt.desc}
                  </div>
                </div>
              ))}
              <div
                style={{ borderTop: "1px solid var(--color-border-faint)" }}
              />
            </>
          )}
        </div>

        {/* Trip navigation */}
        <nav
          className="flex justify-between items-baseline gap-6"
          style={{ marginTop: 72 }}
        >
          {prevEntry ? (
            <Link
              href={prevEntry.href}
              className="trip-nav-link flex flex-col gap-1 no-underline"
              style={{ maxWidth: "45%" }}
            >
              <div
                className="text-[11px] font-semibold uppercase tracking-[0.11em]"
                style={{ color: "var(--color-text-variant)" }}
              >
                ← Previous
              </div>
              <div
                className="trip-nav-name text-[15px] font-semibold tracking-[-0.01em] transition-colors duration-150"
                style={{ color: "var(--color-text)" }}
              >
                {prevEntry.name}
              </div>
              <div
                className="text-[12px]"
                style={{ color: "var(--color-text-variant)" }}
              >
                {fmtNavMeta(prevEntry)}
              </div>
            </Link>
          ) : (
            <div />
          )}
          {nextEntry ? (
            <Link
              href={nextEntry.href}
              className="trip-nav-link flex flex-col gap-1 no-underline items-end text-right"
              style={{ maxWidth: "45%" }}
            >
              <div
                className="text-[11px] font-semibold uppercase tracking-[0.11em]"
                style={{ color: "var(--color-text-variant)" }}
              >
                Next →
              </div>
              <div
                className="trip-nav-name text-[15px] font-semibold tracking-[-0.01em] transition-colors duration-150"
                style={{ color: "var(--color-text)" }}
              >
                {nextEntry.name}
              </div>
              <div
                className="text-[12px]"
                style={{ color: "var(--color-text-variant)" }}
              >
                {fmtNavMeta(nextEntry)}
              </div>
            </Link>
          ) : (
            <div />
          )}
        </nav>
      </div>
    </TripReportLayout>
  );
}

// ── MDX components ─────────────────────────────────────────────────

function parseDayNumbers(label: string): number[] {
  const single = label.match(/^Days?\s+(\d+)$/i);
  if (single) return [parseInt(single[1])];
  const range = label.match(/^Days?\s+(\d+)[–\-](\d+)$/i);
  if (range) {
    const s = parseInt(range[1]);
    const e = parseInt(range[2]);
    return Array.from({ length: e - s + 1 }, (_, i) => s + i);
  }
  return [];
}

function makeDayMarker(
  dayStats: DayStat[],
  stravaByLabel: Record<string, string> = {},
) {
  return function DayMarker({
    label,
    subtitle,
    strava,
  }: {
    label: string;
    subtitle: string;
    strava?: string;
  }) {
    // Falls back to the frontmatter `strava` list, paired by marker order.
    const stravaUrl = strava ?? stravaByLabel[label];
    const days = parseDayNumbers(label);
    let distKm = 0,
      gainM = 0,
      lossM = 0;
    for (const d of days) {
      const s = dayStats[d - 1];
      if (s) {
        distKm += s.distKm;
        gainM += s.gainM;
        lossM += s.lossM;
      }
    }
    const hasStats = dayStats.length > 0 && (distKm > 0 || gainM > 0);

    return (
      <div className="mt-6 first:mt-0" style={{ marginBottom: 12 }}>
        <div
          className="text-[11px] font-semibold uppercase tracking-[0.13em]"
          style={{ color: "var(--color-text-variant)", marginBottom: 4 }}
        >
          {label}
        </div>
        <h3
          className="text-[17px] font-semibold tracking-[-0.015em] leading-[1.25]"
          style={{ color: "var(--color-text)", margin: 0 }}
        >
          {subtitle}
        </h3>
        {(hasStats || stravaUrl) && (
          <div
            className="flex items-baseline flex-wrap gap-x-4 gap-y-[2px] text-[13px] mt-[6px]"
            style={{ color: "var(--color-text-variant)" }}
          >
            {hasStats && (
              <>
                <span>{fmtMiles(distKm)}</span>
                <span>↑ {fmtFeet(gainM)}</span>
                <span>↓ {fmtFeet(lossM)}</span>
              </>
            )}
            {stravaUrl && (
              <a
                href={stravaUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: "var(--color-text-variant)",
                  textDecoration: "none",
                }}
              >
                <span className="underline-border">
                  <span className="b b-bottom" />
                  <span className="b b-right" />
                  <span className="b b-top" />
                  <span className="b b-left" />
                  Strava ↗
                </span>
              </a>
            )}
          </div>
        )}
      </div>
    );
  };
}

function Paragraph({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-[16px] leading-[1.7] mb-[22px]"
      style={{ color: "var(--color-text)", maxWidth: "64ch" }}
    >
      {children}
    </p>
  );
}
