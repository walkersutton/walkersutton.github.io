import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import PageContainer from "@/app/components/PageContainer";
import Footer from "@/app/components/Footer";
import { SITE_CONFIG } from "@/lib/config";
import { getLiveEnabled, getActiveTripName, getLiveReportEntries } from "@/lib/live-state";
import type { LiveReportEntry } from "@/lib/live-state";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Live trip report | Walker Sutton" };

const TZ = SITE_CONFIG.timeZone;

function dayKey(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-CA", { timeZone: TZ });
}

function fmtDayHeading(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: TZ,
  }).format(d);
}

function fmtTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: TZ,
  }).format(d);
}

// Group newest-first entries into day buckets, preserving order.
function groupByDay(entries: LiveReportEntry[]): { key: string; entries: LiveReportEntry[] }[] {
  const groups: { key: string; entries: LiveReportEntry[] }[] = [];
  for (const entry of entries) {
    const key = dayKey(entry.date);
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.entries.push(entry);
    else groups.push({ key, entries: [entry] });
  }
  return groups;
}

export default async function LiveReportPage() {
  const [isOnTrip, tripName, entries] = await Promise.all([
    getLiveEnabled(),
    getActiveTripName(),
    getLiveReportEntries(),
  ]);

  if (!isOnTrip && entries.length === 0) redirect("/trips");

  const groups = groupByDay(entries);

  return (
    <PageContainer>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "40px 4px 96px" }}>
        {isOnTrip && (
          <div
            className="inline-flex items-center gap-[6px] text-[10.5px] font-semibold uppercase tracking-[0.13em] mb-[10px]"
            style={{ color: "var(--accent-green)" }}
          >
            <span className="trips-live-dot" />
            Live
          </div>
        )}

        <div
          className="text-[11px] font-semibold uppercase tracking-[0.13em]"
          style={{ color: "var(--color-text-faint)", marginBottom: 10 }}
        >
          Trip report
        </div>
        <h1
          className="font-semibold leading-[1.08] tracking-[-0.025em]"
          style={
            {
              fontSize: "clamp(28px,4vw,42px)",
              color: "var(--color-text)",
              marginBottom: 24,
              textWrap: "balance",
            } as React.CSSProperties
          }
        >
          {tripName}
        </h1>

        {groups.length === 0 ? (
          <p
            className="text-[16px] leading-[1.7]"
            style={{
              color: "var(--color-text-variant)",
              borderTop: "1px solid var(--color-border-faint)",
              paddingTop: 36,
            }}
          >
            No updates yet.
          </p>
        ) : (
          <div className="flex flex-col">
            {groups.map((group) => (
              <section
                key={group.key}
                style={{
                  borderTop: "1px solid var(--color-border-faint)",
                  paddingTop: 28,
                  marginTop: 28,
                }}
              >
                <h2
                  className="text-[13px] font-semibold uppercase tracking-[0.11em]"
                  style={{ color: "var(--color-text-faint)", marginBottom: 18 }}
                >
                  {fmtDayHeading(group.entries[0].date)}
                </h2>

                {group.entries.map((entry) => (
                  <div key={entry.id} style={{ marginBottom: 28 }}>
                    <div
                      className="text-[11px] font-medium tracking-[0.02em]"
                      style={{ color: "var(--color-text-faint)", marginBottom: 8 }}
                    >
                      {fmtTime(entry.date)}
                    </div>
                    {entry.text && (
                      <p
                        className="text-[16px] leading-[1.7] mb-[16px]"
                        style={{
                          color: "var(--color-text)",
                          maxWidth: "64ch",
                          whiteSpace: "pre-wrap",
                        }}
                      >
                        {entry.text}
                      </p>
                    )}
                    {entry.images.length > 0 && (
                      <div className="flex flex-col gap-[12px]">
                        {entry.images.map((src) => (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            key={src}
                            src={src}
                            alt=""
                            // A trip's report grows without bound, and every
                            // photo on it is a Blob download. Only pay for the
                            // ones a reader actually scrolls to.
                            loading="lazy"
                            decoding="async"
                            className="w-full"
                            style={{ borderRadius: 6, maxWidth: "100%", height: "auto" }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </section>
            ))}
          </div>
        )}

        <div
          style={{
            marginTop: 56,
            paddingTop: 20,
            borderTop: "1px solid var(--color-rule)",
          }}
        >
          <Link
            href="/trips"
            className="text-[13px] font-medium"
            style={{
              color: "var(--color-text-faint)",
              textDecoration: "underline",
              textUnderlineOffset: "2px",
            }}
          >
            All trips
          </Link>
        </div>
      </div>

      <Footer />
    </PageContainer>
  );
}
