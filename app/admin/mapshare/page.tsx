import { getMapShareDiagnostics } from "@/lib/mapshare-server";
import { getMapShareFeedUrl } from "@/lib/live-state";
import FeedUrlForm from "./FeedUrlForm";

// A page, not a route handler, so the admin layout's auth gate covers it: this
// exposes raw position data, unlike /admin/session which exposes nothing.
export const dynamic = "force-dynamic";

function ago(iso: string | undefined): string {
  if (!iso) return "—";
  const then = Date.parse(iso);
  if (!Number.isFinite(then)) return iso;
  const mins = Math.round((Date.now() - then) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  if (mins < 1440) return `${Math.round(mins / 60)} hr ago`;
  return `${Math.round(mins / 1440)} days ago`;
}

const LABEL: React.CSSProperties = {
  fontSize: 12,
  color: "var(--color-text-faint)",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
};

function Row({ label, value, bad }: { label: string; value: string; bad?: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 16,
        padding: "9px 0",
        borderBottom: "1px solid var(--color-border-faint)",
      }}
    >
      <span style={{ fontSize: 13, color: "var(--color-text-variant)" }}>{label}</span>
      <span
        style={{
          fontSize: 13,
          fontWeight: 600,
          textAlign: "right",
          overflowWrap: "anywhere",
          color: bad ? "var(--accent-red, #c0392b)" : "var(--color-text)",
        }}
      >
        {value}
      </span>
    </div>
  );
}

const SOURCE_LABEL: Record<string, string> = {
  stored: "set here in admin",
  env: "deployment environment",
  encrypted: "environment, but still encrypted",
  missing: "not configured anywhere",
};

export default async function MapShareDebugPage() {
  const [d, storedUrl] = await Promise.all([getMapShareDiagnostics(), getMapShareFeedUrl()]);

  const newestAgeMins = d.newest ? (Date.now() - Date.parse(d.newest)) / 60000 : undefined;
  // Garmin trackers commonly send every 10 minutes; anything beyond an hour is
  // worth flagging as "the feed is not keeping up", not just "no recent moves".
  const stale = newestAgeMins !== undefined && newestAgeMins > 60;

  return (
    <div style={{ marginBottom: 40 }}>
      <p style={{ ...LABEL, marginBottom: 12 }}>MapShare feed</p>

      <FeedUrlForm current={storedUrl} />

      {!d.configured && (
        <p style={{ fontSize: 13, color: "var(--accent-red, #c0392b)" }}>
          No feed URL is set here or in the deployment environment.
        </p>
      )}

      {d.configured && (
        <>
          <Row label="Reading feed from" value={SOURCE_LABEL[d.source] ?? d.source} />
          <Row label="Feed host" value={d.feedHost || "—"} />
          <Row label="HTTP status" value={d.status ? String(d.status) : "—"} bad={!!d.error} />
          {d.error && <Row label="Error" value={d.error} bad />}
          <Row label="Trip-start bound (d1)" value={d.hasD1 ? "set" : "not set"} />
          <Row
            label="End bound (d2) in config"
            value={d.hasD2 ? "set — stripped before fetching" : "not set"}
          />
          <Row label="Response size" value={d.bytes !== undefined ? `${d.bytes} bytes` : "—"} />
          <Row label="Placemarks in KML" value={d.placemarks !== undefined ? String(d.placemarks) : "—"} />
          <Row
            label="Parsed"
            value={
              d.totalPoints !== undefined
                ? `${d.totalPoints} points (${d.tracks} tracks, ${d.points} pins)`
                : "—"
            }
            bad={d.totalPoints === 0}
          />
          <Row label="Oldest point" value={d.oldest ? `${d.oldest} (${ago(d.oldest)})` : "—"} />
          <Row
            label="Newest point"
            value={d.newest ? `${d.newest} (${ago(d.newest)})` : "—"}
            bad={stale}
          />

          <p style={{ fontSize: 12, marginTop: 16, color: "var(--color-text-variant)", lineHeight: 1.6 }}>
            {!d.newest
              ? "No timestamped points came back at all, so there is nothing for the map to draw. Check the HTTP status and error above — a feed that is unreachable or returning an empty document fails this way."
              : stale
                ? "The newest point Garmin is returning is over an hour old. If MapShare's own site shows something newer, the feed URL is returning a narrower window than the site does."
                : "Newest point is recent — the feed is delivering current data, so anything stale on the map is in rendering, not the feed."}
          </p>

          {d.rawLastPlacemark && (
            <>
              <p style={{ ...LABEL, marginTop: 28, marginBottom: 8 }}>Last placemark (raw)</p>
              <pre
                style={{
                  fontSize: 11,
                  lineHeight: 1.5,
                  overflowX: "auto",
                  padding: 12,
                  background: "var(--color-bg-subtle, rgba(127,127,127,0.08))",
                  border: "1px solid var(--color-border-faint)",
                  whiteSpace: "pre-wrap",
                  overflowWrap: "anywhere",
                }}
              >
                {d.rawLastPlacemark}
              </pre>
            </>
          )}

          {d.rawHead && (
            <>
              <p style={{ ...LABEL, marginTop: 24, marginBottom: 8 }}>Feed head (raw)</p>
              <pre
                style={{
                  fontSize: 11,
                  lineHeight: 1.5,
                  overflowX: "auto",
                  padding: 12,
                  background: "var(--color-bg-subtle, rgba(127,127,127,0.08))",
                  border: "1px solid var(--color-border-faint)",
                  whiteSpace: "pre-wrap",
                  overflowWrap: "anywhere",
                }}
              >
                {d.rawHead}
              </pre>
            </>
          )}
        </>
      )}
    </div>
  );
}
