import { redirect } from "next/navigation";
import TripMap, { type LiveReportPreview } from "../TripMap";
import { getLiveEnabled, getActiveTripName, getLiveReportEntries } from "@/lib/live-state";
import { resolveFeedSource } from "@/lib/mapshare-server";

function fmtDateLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(d);
}

// First sentence or two of an entry, trimmed to a readable preview length.
function toExcerpt(text: string): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return "";
  const sentences = clean.match(/[^.!?]+[.!?]+/g);
  let out =
    sentences && sentences.length
      ? sentences.slice(0, 2).map((s) => s.trim()).join(" ")
      : clean;
  if (out.length > 180) out = `${out.slice(0, 179).trimEnd()}…`;
  return out;
}

export default async function TripLivePage() {
  // Resolved rather than reading the env var directly: the URL may be set in
  // admin instead, and an undecrypted env value is truthy but unusable.
  const feed = await resolveFeedSource();
  if (feed.kind === "missing" || feed.kind === "encrypted") redirect("/trips");

  const [isOnTrip, activeTripName, entries] = await Promise.all([
    getLiveEnabled(),
    getActiveTripName(),
    getLiveReportEntries(),
  ]);
  if (!isOnTrip) redirect("/trips");

  const recentPosts: LiveReportPreview[] = entries.slice(0, 2).map((entry) => ({
    id: entry.id,
    dateLabel: fmtDateLabel(entry.date),
    excerpt: toExcerpt(entry.text),
  }));

  return <TripMap isOnTrip={isOnTrip} activeTripName={activeTripName} recentPosts={recentPosts} />;
}
