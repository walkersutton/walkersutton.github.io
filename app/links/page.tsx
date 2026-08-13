import type { Metadata } from "next";
import Link from "next/link";
import chronicallyOnline from "@/data/chronicallyOnline.json";
import { SITE_CONFIG } from "@/lib/config";
import { getLiveEnabled, getActiveTripName, getLiveReportEntries } from "@/lib/live-state";

// Reads live state to decide whether the trip links belong on the page.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Links | Walker Sutton",
  description: "Walker Sutton's links.",
};

type LinkItem = { label: string; note?: string; href: string; external?: boolean };

/**
 * `links: true` in the JSON picks what shows up here, the same way `footer:
 * true` picks the icons in the footer — featuring another profile is one flag,
 * not a code change.
 */
const SOCIAL_LINKS: LinkItem[] = (
  chronicallyOnline as { name: string; href: string; links?: boolean }[]
)
  .filter((social) => social.links)
  .map((social) => ({ label: social.name, href: social.href, external: true }));

// A row is the whole tap target — full width, thumb-height, and spaced far
// enough apart that the wrong one is hard to hit one-handed on a bike.
const ROW: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: 60,
  padding: "16px 20px",
  border: "1.5px solid var(--color-text)",
  color: "var(--color-text)",
  textDecoration: "none",
  fontSize: 16,
  fontWeight: 600,
  letterSpacing: "-0.01em",
  textAlign: "center",
};

function LinkRow({ label, href, external }: LinkItem) {
  // Internal links go through next/link so they navigate client-side and get
  // counted; external ones are plain anchors that leave the site.
  return external ? (
    <a href={href} target="_blank" rel="noopener noreferrer" style={ROW}>
      {label}
    </a>
  ) : (
    <Link href={href} style={ROW}>
      {label}
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
  const links: LinkItem[] = [
    ...(isOnTrip ? [{ label: "Live tracker", href: "/trips/live" }] : []),
    ...(isOnTrip || entries.length > 0
      ? [{ label: "Trip report", href: "/trips/live/report" }]
      : []),
    { label: "Website", href: "/" },
    ...SOCIAL_LINKS,
  ];

  return (
    // The layout hides the header and footer here (BARE_ROUTES), so this owns
    // the whole screen. Content sits toward the top rather than vertically
    // centred: centring depends on a definite parent height, which a flex-grow
    // wrapper doesn't reliably give, and a link page that shifts as links come
    // and go with the trip is worse than one that starts where it always does.
    <main
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "64px 0 72px",
      }}
    >
      <div style={{ width: "100%", maxWidth: 400 }}>
        {isOnTrip && (
          <div
            className="flex items-center justify-center gap-[6px] text-[10.5px] font-semibold uppercase tracking-[0.13em] mb-[10px]"
            style={{ color: "var(--accent-green)" }}
          >
            <span className="trips-live-dot" />
            {tripName}
          </div>
        )}

        <h1
          className="font-semibold leading-[1.1] tracking-[-0.025em] text-center"
          style={{ fontSize: "clamp(26px,7vw,34px)", color: "var(--color-text)", marginBottom: 28 }}
        >
          {SITE_CONFIG.title}
        </h1>

        <nav style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {links.map((item) => (
            <LinkRow key={item.href} {...item} />
          ))}
        </nav>
      </div>
    </main>
  );
}
