import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { getAllTripSlugs, getTripBySlug } from "@/lib/trips";
import LeafletReportMapLoader from "./LeafletReportMapLoader";

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

export default async function TripReportPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;
  const trip = getTripBySlug(slug);
  if (!trip) notFound();

  const { frontmatter: fm, content } = trip;

  return (
    <main>
      {/* ── Back bar ── */}
      {/* <div
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
      </div> */}

      {/* ── Full-bleed map ── */}
      <div
        style={{
          width: "100vw",
          marginLeft: "calc(-50vw + 50%)",
          height: "60vh",
          minHeight: 340,
          maxHeight: 620,
          position: "relative",
        }}
      >
        <LeafletReportMapLoader
          tracks={fm.tracks}
          waypoints={fm.waypoints}
          start={fm.start}
        />
      </div>

      {/* ── Content below map ── */}
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 28px 96px" }}>
        {/* Title */}
        <div
          className="text-[11px] font-semibold uppercase tracking-[0.13em]"
          style={{
            color: "var(--color-text-faint)",
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
          {fm.title}.
        </h1>
        <div
          className="flex items-center flex-wrap gap-4 text-[14px]"
          style={{ color: "var(--color-text-faint)" }}
        >
          <span>{fm.dates}</span>
          <span
            className="w-[3px] h-[3px] rounded-full shrink-0"
            style={{ background: "var(--color-text-faint)" }}
          />
          <span>{fm.region}</span>
          <span
            className="w-[3px] h-[3px] rounded-full shrink-0"
            style={{ background: "var(--color-text-faint)" }}
          />
          <span>{fm.days} days</span>
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
            { lbl: "Distance", val: fm.stats.distance },
            { lbl: "Gained", val: fm.stats.gained },
            { lbl: "Lost", val: fm.stats.lost },
            { lbl: "Days", val: String(fm.days) },
          ].map((s, i) => (
            <div
              key={s.lbl}
              style={{
                padding: "16px 0 16px 18px",
                borderLeft:
                  i === 0 ? "none" : "1px solid var(--color-border-faint)",
                paddingLeft: i === 0 ? 0 : 18,
              }}
            >
              <div
                className="text-[10px] font-semibold uppercase tracking-[0.13em] mb-[5px]"
                style={{ color: "var(--color-text-faint)" }}
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
          <div
            style={{
              padding: "16px 0 16px 18px",
              borderLeft: "1px solid var(--color-border-faint)",
            }}
          >
            <div
              className="text-[10px] font-semibold uppercase tracking-[0.13em] mb-[5px]"
              style={{ color: "var(--color-text-faint)" }}
            >
              Dates
            </div>
            <div
              className="text-[13px] font-medium leading-[1.3]"
              style={{ color: "var(--color-text-variant)" }}
            >
              {fm.dateStart}
              <br />
              {fm.dateEnd}
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
          <MDXRemote
            source={content}
            components={{
              DayMarker,
              p: Paragraph,
            }}
          />

          {/* Waypoints */}
          <h3
            className="text-[13px] font-semibold uppercase tracking-[0.08em]"
            style={{
              color: "var(--color-text-faint)",
              marginTop: 36,
              marginBottom: 12,
            }}
          >
            Waypoints
          </h3>
          {fm.waypoints.map((wpt) => (
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
                style={{ color: "var(--color-text-faint)" }}
              >
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
          {fm.prev ? (
            <Link
              href={fm.prev.href}
              className="trip-nav-link flex flex-col gap-1 no-underline"
              style={{ maxWidth: "45%" }}
            >
              <div
                className="text-[11px] font-semibold uppercase tracking-[0.11em]"
                style={{ color: "var(--color-text-faint)" }}
              >
                ← Previous
              </div>
              <div
                className="trip-nav-name text-[15px] font-semibold tracking-[-0.01em] transition-colors duration-150"
                style={{ color: "var(--color-text)" }}
              >
                {fm.prev.name}
              </div>
              <div
                className="text-[12px]"
                style={{ color: "var(--color-text-faint)" }}
              >
                {fm.prev.meta}
              </div>
            </Link>
          ) : (
            <div />
          )}
          {fm.next ? (
            <Link
              href={fm.next.href}
              className="trip-nav-link flex flex-col gap-1 no-underline items-end text-right"
              style={{ maxWidth: "45%" }}
            >
              <div
                className="text-[11px] font-semibold uppercase tracking-[0.11em]"
                style={{ color: "var(--color-text-faint)" }}
              >
                Next →
              </div>
              <div
                className="trip-nav-name text-[15px] font-semibold tracking-[-0.01em] transition-colors duration-150"
                style={{ color: "var(--color-text)" }}
              >
                {fm.next.name}
              </div>
              <div
                className="text-[12px]"
                style={{ color: "var(--color-text-faint)" }}
              >
                {fm.next.meta}
              </div>
            </Link>
          ) : (
            <div />
          )}
        </nav>
      </div>
    </main>
  );
}

// ── MDX components ─────────────────────────────────────────────────
function DayMarker({ label, subtitle }: { label: string; subtitle: string }) {
  return (
    <div
      className="inline-flex items-baseline gap-[10px] text-[11px] font-semibold uppercase tracking-[0.11em] mb-[10px]"
      style={{ color: "var(--color-text-faint)", marginTop: 36 }}
    >
      {label}
      <span
        className="text-[13px] font-semibold tracking-[-0.01em] normal-case"
        style={{ color: "var(--color-text)" }}
      >
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
