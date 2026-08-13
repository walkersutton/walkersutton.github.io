import type { Metadata } from "next";
import Link from "next/link";
import SkullMark from "@/app/components/SkullMark";
import chronicallyOnline from "@/data/chronicallyOnline.json";
import { SITE_CONFIG } from "@/lib/config";
import { getLiveEnabled, getActiveTripName, getLiveReportEntries } from "@/lib/live-state";

// Reads live state to decide whether the trip links belong on the page.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Links | Walker Sutton",
  description: "Walker Sutton's links.",
};

// Strava's chevron. Both halves are one subpath continued with a relative
// moveto — splitting them into two absolute subpaths closes the upper chevron
// into a solid triangle, which is not the logo.
function StravaIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
    </svg>
  );
}

/** Keyed by the social's name in chronicallyOnline.json, same as the footer. */
const ICONS: Record<string, () => React.ReactElement> = {
  Strava: StravaIcon,
};

type LinkItem = {
  label: string;
  href: string;
  external?: boolean;
  icon?: () => React.ReactElement;
};

/**
 * `links: true` in the JSON picks what shows up here, the same way `footer:
 * true` picks the icons in the footer — featuring another profile is one flag,
 * plus an icon here if it has one.
 */
const SOCIAL_LINKS: LinkItem[] = (
  chronicallyOnline as { name: string; href: string; links?: boolean }[]
)
  .filter((social) => social.links)
  .map((social) => ({
    label: social.name,
    href: social.href,
    external: true,
    icon: ICONS[social.name],
  }));

// A row is the whole tap target — full width, thumb-height, and spaced far
// enough apart that the wrong one is hard to hit one-handed on a bike.
const ROW: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 9,
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

function LinkRow({ label, href, external, icon: Icon }: LinkItem) {
  const body = (
    <>
      {Icon && <Icon />}
      {label}
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
        padding: "52px 0 72px",
      }}
    >
      <div style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 22 }}>
          <SkullMark />
        </div>

        <h1
          className="font-semibold leading-[1.1] tracking-[-0.025em] text-center"
          style={{ fontSize: "clamp(26px,7vw,34px)", color: "var(--color-text)" }}
        >
          {SITE_CONFIG.title}
        </h1>

        {/* Sits under the name as its subtitle, so the gap below the heading
            block is the same whether or not there's a trip on. */}
        {isOnTrip && (
          <div
            className="flex items-center justify-center gap-[6px] text-[10.5px] font-semibold uppercase tracking-[0.13em]"
            style={{ color: "var(--accent-green)", marginTop: 10 }}
          >
            <span className="trips-live-dot" />
            {tripName}
          </div>
        )}

        <nav style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 34 }}>
          {links.map((item) => (
            <LinkRow key={item.href} {...item} />
          ))}
        </nav>
      </div>
    </main>
  );
}
