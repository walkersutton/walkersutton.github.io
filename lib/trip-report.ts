import fs from "fs";
import path from "path";
import type { LiveReportEntry } from "./live-state";
import { entryTimeZone } from "./report-time";

/**
 * A finished trip's report, frozen into the repo.
 *
 * The live report lives in one mutable array in the Blob store, holds one trip
 * at a time, and `/trips/live/report` redirects away once that array is empty.
 * So the day the next trip starts — or the moment **Clear all** is used — the
 * last trip's updates stop existing anywhere a reader can reach. That is fine
 * for a feed and wrong for a record: the write-up under /trips is the edited
 * account, and this is what was actually typed on the day, timestamps and all.
 *
 * `pnpm export:report` writes it next to the mdx as `<slug>.report.json`, with
 * the photo URLs it re-uploaded, so the archive and the write-up point at the
 * same durable copies. It is plain committed JSON: nothing reads it at request
 * time and nothing can overwrite it but a deliberate edit.
 */
export type TripReportEntry = LiveReportEntry;

export interface ReportDay {
  /** yyyy-mm-dd in the zone the day's first update was posted from. */
  key: string;
  entries: TripReportEntry[];
}

const tripsDirectory = path.join(process.cwd(), "content/trips");

function reportPath(slug: string): string {
  return path.join(tripsDirectory, `${slug}.report.json`);
}

export function hasTripReport(slug: string): boolean {
  return fs.existsSync(reportPath(slug));
}

export function getTripReportSlugs(): string[] {
  if (!fs.existsSync(tripsDirectory)) return [];
  return fs
    .readdirSync(tripsDirectory)
    .filter((file) => file.endsWith(".report.json"))
    .map((file) => file.replace(/\.report\.json$/, ""));
}

/**
 * Oldest first — the opposite of the live feed, which leads with the newest
 * because that is the update a reader came back for. A finished trip is read
 * the way it was ridden, and in the same order as the write-up beside it.
 */
export function getTripReport(slug: string): TripReportEntry[] | null {
  const file = reportPath(slug);
  if (!fs.existsSync(file)) return null;

  const entries = JSON.parse(fs.readFileSync(file, "utf8")) as TripReportEntry[];
  if (!Array.isArray(entries)) return null;

  return [...entries].sort((a, b) => Date.parse(a.date) - Date.parse(b.date));
}

// ── Day grouping and formatting ───────────────────────────────────
//
// Shared with /trips/live/report so an archived trip reads exactly as it did
// while it was live. Times are shown in the zone the update was posted from,
// not the site's and not the reader's: on a trip that crosses the country,
// "7:20 AM" is only meaningful next to where Walker was standing when he
// wrote it.

export function dayKey(entry: TripReportEntry): string {
  const date = new Date(entry.date);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-CA", { timeZone: entryTimeZone(entry.tz) });
}

export function fmtDayHeading(entry: TripReportEntry): string {
  const date = new Date(entry.date);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: entryTimeZone(entry.tz),
  }).format(date);
}

/** e.g. "7:20 AM MDT" — the zone is the point, so it is always shown. */
export function fmtTime(entry: TripReportEntry): string {
  const date = new Date(entry.date);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: entryTimeZone(entry.tz),
    timeZoneName: "short",
  }).format(date);
}

/**
 * Bucket entries into days, preserving the order given. A day is a day where
 * the update was written, so riding into a new zone at midnight splits the
 * entries the way the rider experienced it.
 */
export function groupByDay(entries: TripReportEntry[]): ReportDay[] {
  const days: ReportDay[] = [];
  for (const entry of entries) {
    const key = dayKey(entry);
    const last = days[days.length - 1];
    if (last && last.key === key) last.entries.push(entry);
    else days.push({ key, entries: [entry] });
  }
  return days;
}
