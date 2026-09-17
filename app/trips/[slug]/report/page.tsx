import type { Metadata } from "next";
import Link from "next/link";
import { draftMode } from "next/headers";
import { notFound } from "next/navigation";
import PageContainer from "@/app/components/PageContainer";
import Footer from "@/app/components/Footer";
import Pager from "@/app/components/Pager";
import ReportEntries from "@/app/components/ReportEntries";
import { paginate } from "@/lib/paginate";
import { getTripBySlug } from "@/lib/trips";
import { getTripReport, getTripReportSlugs, groupByDay } from "@/lib/trip-report";

export async function generateStaticParams() {
  return getTripReportSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await props.params;
  const trip = getTripBySlug(slug);
  if (!trip) return {};
  return { title: `${trip.frontmatter.title} — original report | Walker Sutton` };
}

function pageHref(slug: string) {
  // Page 1 is the bare URL, so the link people share keeps working.
  return (page: number) =>
    page <= 1 ? `/trips/${slug}/report` : `/trips/${slug}/report?page=${page}`;
}

/**
 * The trip's live report exactly as it was published, kept beside the edited
 * write-up at /trips/<slug>.
 *
 * Static, read from `content/trips/<slug>.report.json` at build time — the live
 * feed's store holds one trip at a time, so nothing here can depend on it.
 */
export default async function TripReportArchivePage(props: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const [{ slug }, { page }] = await Promise.all([props.params, props.searchParams]);

  const trip = getTripBySlug(slug);
  const entries = getTripReport(slug);
  if (!trip || !entries || entries.length === 0) notFound();

  const { isEnabled: showDrafts } = await draftMode();
  if (trip.frontmatter.draft && !showDrafts) notFound();

  const { pageItems, currentPage, totalPages } = paginate(entries, page);
  const days = groupByDay(pageItems);

  return (
    <PageContainer>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "40px 4px 96px" }}>
        <div
          className="text-[11px] font-semibold uppercase tracking-[0.13em]"
          style={{ color: "var(--color-text-faint)", marginBottom: 10 }}
        >
          Original report
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
          {trip.frontmatter.title}
        </h1>

        <p
          className="text-[15px] leading-[1.6]"
          style={{ color: "var(--color-text-variant)", maxWidth: "58ch", marginBottom: 4 }}
        >
          Posted from the road as it happened, unedited. The written-up version is
          over at{" "}
          <Link
            href={`/trips/${slug}`}
            style={{ color: "var(--color-text)", textDecoration: "underline", textUnderlineOffset: "2px" }}
          >
            {trip.frontmatter.title}
          </Link>
          .
        </p>

        <ReportEntries days={days} />

        <Pager
          currentPage={currentPage}
          totalPages={totalPages}
          hrefFor={pageHref(slug)}
          label="Report pages"
        />

        <div
          style={{ marginTop: 56, paddingTop: 20, borderTop: "1px solid var(--color-rule)" }}
        >
          <Link
            href={`/trips/${slug}`}
            className="text-[13px] font-medium"
            style={{
              color: "var(--color-text-faint)",
              textDecoration: "underline",
              textUnderlineOffset: "2px",
            }}
          >
            ← {trip.frontmatter.title}
          </Link>
        </div>
      </div>

      <Footer />
    </PageContainer>
  );
}
