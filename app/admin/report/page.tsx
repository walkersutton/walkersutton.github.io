import Pager from "@/app/components/Pager";
import { getLiveReportEntries } from "@/lib/live-state";
import { findMissingEntryIds } from "@/lib/report-archive";
import { paginate } from "@/lib/paginate";
import { dayKey, fmtDayHeading, groupByDay } from "@/lib/trip-report";
import ClearAllButton from "./ClearAllButton";
import ReportEditor from "./ReportEditor";
import ReportEntryItem from "./ReportEntryItem";
import ReportRecovery from "./ReportRecovery";
import ShrinkPhotosButton from "./ShrinkPhotosButton";

export const dynamic = "force-dynamic";
// Server Actions on this page run under this budget, and listing the photos to
// shrink is one head() per photo in the trip.
export const maxDuration = 60;

/** Page 1 is the bare URL, so the link in the admin nav never carries a page. */
function pageHref(page: number): string {
  return page <= 1 ? "/admin/report" : `/admin/report?page=${page}`;
}

export default async function AdminReportPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const [{ page }, entries] = await Promise.all([
    searchParams,
    getLiveReportEntries(),
  ]);
  // Same paging as the public report: the thumbnails here are the full-size
  // uploads scaled down by the browser, and this is the page that gets reloaded
  // after every post.
  const { pageItems, currentPage, totalPages } = paginate(entries, page);
  // Same day buckets as the public report: a day is the day where the update
  // was written. Counted across every page, so a day split by the pager still
  // says how many updates it has in total.
  const days = groupByDay(pageItems);
  const perDay = new Map<string, number>();
  for (const entry of entries) {
    const key = dayKey(entry);
    perDay.set(key, (perDay.get(key) ?? 0) + 1);
  }

  // One list() against the archive, no downloads. Anything it holds that the
  // report doesn't is an update that went missing rather than one that was
  // deleted, so it is worth checking on the page that would notice.
  let missing: string[] = [];
  try {
    missing = await findMissingEntryIds(entries);
  } catch (error) {
    console.error("AdminReportPage: could not check the archive", error);
  }

  return (
    <div>
      <h1 className="adm-page-title">Report</h1>
      <p className="adm-page-sub">Post an update to the live trip report.</p>

      <ReportEditor />

      {missing.length > 0 && <ReportRecovery missing={missing.length} />}

      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          marginBottom: 12,
          paddingBottom: 8,
          borderBottom: "1px solid var(--color-border-faint)",
        }}
      >
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "var(--color-text-variant)",
          }}
        >
          {entries.length} update{entries.length !== 1 ? "s" : ""}
          {totalPages > 1 && ` · page ${currentPage}/${totalPages}`}
        </span>
        {entries.length > 0 && <ClearAllButton count={entries.length} />}
      </div>

      {entries.length === 0 ? (
        <p style={{ fontSize: 13, color: "var(--color-text-faint)" }}>
          No updates yet.
        </p>
      ) : (
        <div className="adm-days">
          {days.map((day) => {
            const count = perDay.get(day.key) ?? day.entries.length;
            return (
              <section key={day.key} className="adm-day">
                <header className="adm-day-head">
                  <h2 className="adm-day-title">
                    {fmtDayHeading(day.entries[0])}
                  </h2>
                  <span className="adm-day-count">
                    {count} update{count === 1 ? "" : "s"}
                  </span>
                </header>
                <div className="adm-card">
                  {day.entries.map((entry) => (
                    <ReportEntryItem key={entry.id} entry={entry} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}

      <Pager
        currentPage={currentPage}
        totalPages={totalPages}
        hrefFor={pageHref}
        label="Update pages"
      />

      {entries.some((entry) => entry.images.length > 0) && (
        <div
          style={{
            marginTop: 32,
            paddingTop: 16,
            borderTop: "1px solid var(--color-border-faint)",
          }}
        >
          <div style={{ fontSize: 13, color: "var(--color-text-faint)" }}>
            Photos posted before the app started shrinking them are still full
            camera size, which is what runs down the Blob transfer allowance.
            Shrinking pulls each one back to this phone to re-encode it, so do
            it on wifi if you can. Safe to stop and pick up later.
          </div>
          <ShrinkPhotosButton />
        </div>
      )}
    </div>
  );
}
