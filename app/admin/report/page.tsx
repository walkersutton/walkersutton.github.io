import Pager from "@/app/components/Pager";
import { getLiveReportEntries } from "@/lib/live-state";
import { paginate } from "@/lib/paginate";
import { clearReportEntries } from "../actions";
import ReportEditor from "./ReportEditor";
import ReportEntryItem from "./ReportEntryItem";
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
  const [{ page }, entries] = await Promise.all([searchParams, getLiveReportEntries()]);
  // Same paging as the public report: the thumbnails here are the full-size
  // uploads scaled down by the browser, and this is the page that gets reloaded
  // after every post.
  const { pageItems, currentPage, totalPages } = paginate(entries, page);

  return (
    <div>
      <ReportEditor />

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
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.11em",
            textTransform: "uppercase",
            color: "var(--color-text-faint)",
          }}
        >
          {entries.length} update{entries.length !== 1 ? "s" : ""}
          {totalPages > 1 && ` · page ${currentPage}/${totalPages}`}
        </span>
        {entries.length > 0 && (
          <form action={clearReportEntries}>
            <button
              type="submit"
              style={{
                background: "none",
                border: "none",
                padding: "8px 2px",
                fontSize: 13,
                color: "var(--color-text-faint)",
                cursor: "pointer",
                fontFamily: "inherit",
                textDecoration: "underline",
                textUnderlineOffset: 3,
              }}
            >
              Clear all
            </button>
          </form>
        )}
      </div>

      {entries.length === 0 ? (
        <p style={{ fontSize: 13, color: "var(--color-text-faint)" }}>No updates yet.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {pageItems.map((entry) => (
            <ReportEntryItem key={entry.id} entry={entry} />
          ))}
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
