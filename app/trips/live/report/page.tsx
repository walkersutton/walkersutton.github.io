import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import PageContainer from "@/app/components/PageContainer";
import Footer from "@/app/components/Footer";
import Pager from "@/app/components/Pager";
import ReportEntries from "@/app/components/ReportEntries";
import { paginate } from "@/lib/paginate";
import { groupByDay } from "@/lib/trip-report";
import { getLiveEnabled, getActiveTripName, getLiveReportEntries } from "@/lib/live-state";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Live trip report | Walker Sutton" };

/** Page 1 is the bare URL; deeper pages carry ?page=N. */
function pageHref(page: number): string {
  return page <= 1 ? "/trips/live/report" : `/trips/live/report?page=${page}`;
}

export default async function LiveReportPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const [{ page }, isOnTrip, tripName, entries] = await Promise.all([
    searchParams,
    getLiveEnabled(),
    getActiveTripName(),
    getLiveReportEntries(),
  ]);

  if (!isOnTrip && entries.length === 0) redirect("/trips");

  const { pageItems, currentPage, totalPages } = paginate(entries, page);
  const groups = groupByDay(pageItems);

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
          <ReportEntries days={groups} />
        )}

        <Pager
          currentPage={currentPage}
          totalPages={totalPages}
          hrefFor={pageHref}
          label="Trip report pages"
        />

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
