import type { Metadata } from "next";
import Link from "next/link";
import PageContainer from "@/app/components/PageContainer";
import Footer from "@/app/components/Footer";
import chronicallyOnline from "@/data/chronicallyOnline.json";
import { SITE_CONFIG } from "@/lib/config";
import { getLiveEnabled, getActiveTripName, getLiveReportEntries } from "@/lib/live-state";

// Reads live state to decide whether the trip links belong on the page.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Links | Walker Sutton",
  description: "Everywhere Walker Sutton is, in one place.",
};

type LinkItem = { label: string; note: string; href: string; external?: boolean };

/**
 * The socials worth putting in front of someone who followed a link from a bio.
 * `links: true` in the JSON picks them, the same way `footer: true` picks the
 * icons in the footer — adding another is one flag, not a code change.
 */
const SOCIAL_LINKS: LinkItem[] = (
  chronicallyOnline as { name: string; href: string; links?: boolean }[]
)
  .filter((social) => social.links)
  .map((social) => ({
    label: social.name,
    note: new URL(social.href).hostname.replace(/^www\./, ""),
    href: social.href,
    external: true,
  }));

const ROW: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 16,
  // 64px tall: this page exists to be tapped, usually one-handed.
  minHeight: 64,
  padding: "12px 18px",
  border: "1.5px solid var(--color-text)",
  color: "var(--color-text)",
  textDecoration: "none",
};

function LinkRow({ label, note, href, external }: LinkItem) {
  const body = (
    <>
      <span style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: "-0.01em" }}>{label}</span>
        <span style={{ fontSize: 12, color: "var(--color-text-faint)" }}>{note}</span>
      </span>
      <span aria-hidden style={{ fontSize: 15, color: "var(--color-text-faint)" }}>
        {external ? "↗" : "→"}
      </span>
    </>
  );

  // Internal links go through next/link so they navigate client-side and get
  // counted; external ones are plain anchors that leave the site.
  return external ? (
    <a href={href} target="_blank" rel="noopener noreferrer" style={ROW}>
      {body}
    </a>
  ) : (
    <Link href={href} style={ROW}>
      {body}
    </Link>
  );
}

export default async function LinksPage() {
  const [isOnTrip, tripName, entries] = await Promise.all([
    getLiveEnabled(),
    getActiveTripName(),
    getLiveReportEntries(),
  ]);

  // The tracker is only a live feed while there is a trip to track, and the
  // report is worth linking to for as long as it has anything in it. A dead
  // link at the top of a link page is worse than one fewer link.
  const tripLinks: LinkItem[] = [
    ...(isOnTrip
      ? [{ label: "Live tracker", note: "where I am right now", href: "/trips/live" }]
      : []),
    ...(isOnTrip || entries.length > 0
      ? [{ label: "Trip report", note: "photos and updates from the road", href: "/trips/live/report" }]
      : []),
  ];

  const siteLinks: LinkItem[] = [
    {
      label: "walkersutton.com",
      note: "posts, projects, past trips",
      href: "/",
    },
  ];

  return (
    <PageContainer>
      <div style={{ maxWidth: 420, margin: "0 auto", padding: "40px 4px 96px" }}>
        {isOnTrip && (
          <div
            className="inline-flex items-center gap-[6px] text-[10.5px] font-semibold uppercase tracking-[0.13em] mb-[10px]"
            style={{ color: "var(--accent-green)" }}
          >
            <span className="trips-live-dot" />
            {tripName}
          </div>
        )}

        <h1
          className="font-semibold leading-[1.08] tracking-[-0.025em]"
          style={{ fontSize: "clamp(28px,4vw,42px)", color: "var(--color-text)", marginBottom: 8 }}
        >
          {SITE_CONFIG.title}
        </h1>
        <p
          className="text-[14px] leading-[1.6]"
          style={{ color: "var(--color-text-variant)", marginBottom: 28 }}
        >
          Everywhere I am, in one place.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[...tripLinks, ...siteLinks, ...SOCIAL_LINKS].map((item) => (
            <LinkRow key={item.href} {...item} />
          ))}
        </div>
      </div>

      <Footer />
    </PageContainer>
  );
}
