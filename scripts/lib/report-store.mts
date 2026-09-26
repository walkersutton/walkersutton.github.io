/**
 * Reading the live trip report out of its Blob store, and the day grouping and
 * photo naming that every export of it is built on.
 *
 * Shared by scripts/export-report.mts and scripts/backfill-report-archive.mts.
 * `nameByUrl` in particular has to be one function rather than two copies: the
 * backfill joins a trip's photos onto the URLs an earlier export already wrote
 * by matching those names, so a second copy that drifted would not fail, it
 * would quietly file every photo under the wrong update.
 */
import { get, list } from "@vercel/blob";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

/** Mirrors LiveReportEntry in lib/live-state.ts. */
export interface ReportEntry {
  id: string;
  date: string;
  text: string;
  images: string[];
  /** IANA zone the update was posted from; absent on older entries. */
  tz?: string;
}

type BlobOptions = { access: "private"; token: string };

const STATE_FILE = join("data", "live-state.json");
const STATE_BLOB_PATH = "live-state.json";
const ARCHIVE_PREFIX = "report-entries/";
/** SITE_CONFIG.timeZone — the fallback for entries posted before `tz` existed. */
const SITE_TZ = "America/Los_Angeles";

// ── Reading the report ────────────────────────────────────────────

/** Which env var supplied the token, so an empty result can say where it looked. */
type TokenSource = "LIVE_STATE_BLOB_READ_WRITE_TOKEN" | "BLOB_READ_WRITE_TOKEN";

/**
 * Same store and same token preference as lib/live-state.ts: the dedicated
 * live-state store when it is configured, Vercel's default Blob store
 * otherwise. A value that is still dotenvx ciphertext never decrypted and is
 * no more usable than a missing one.
 */
function stateBlobOptions(): { blob: BlobOptions; via: TokenSource } | null {
  const dedicated = process.env.LIVE_STATE_BLOB_READ_WRITE_TOKEN;
  const via: TokenSource = dedicated ? "LIVE_STATE_BLOB_READ_WRITE_TOKEN" : "BLOB_READ_WRITE_TOKEN";
  const token = dedicated ?? process.env.BLOB_READ_WRITE_TOKEN;
  if (!token || token.startsWith("encrypted:")) return null;
  return { blob: { access: "private", token }, via };
}

async function readLocalState(): Promise<Record<string, unknown>> {
  return JSON.parse(await readFile(STATE_FILE, "utf8"));
}

/**
 * Why a missing live-state.json is a hard stop rather than a fallback.
 *
 * lib/live-state.ts falls back to the committed data/live-state.json when the
 * store has nothing, and is right to: seeding an empty store on first boot is
 * what the seed is for. Exporting it is never what anyone wants. It is
 * months-old git data shaped exactly like a real trip, and this script writes
 * an mdx file and uploads photos off the back of what it reads, so a quiet
 * fallback spends real work producing a real-looking export of the wrong trip.
 *
 * The likeliest cause is also not an empty store. BLOB_READ_WRITE_TOKEN points
 * at the public image store, and only the deployment is given the dedicated
 * one, so falling back to it locally looks in a store the report was never
 * written to — at which point "the store is empty" is a false statement about
 * a store nobody asked about.
 */
function unreachable(via: TokenSource | null): Error {
  if (via === null) {
    return new Error(
      "no usable Blob token: neither LIVE_STATE_BLOB_READ_WRITE_TOKEN nor\n" +
        "BLOB_READ_WRITE_TOKEN is set, or both are still dotenvx ciphertext.\n\n" +
        "pass --local to export the committed seed instead.",
    );
  }
  if (via === "BLOB_READ_WRITE_TOKEN") {
    return new Error(
      `no ${STATE_BLOB_PATH} in the store BLOB_READ_WRITE_TOKEN points at.\n\n` +
        "that is the public image store — the one `pnpm img` uploads to. the report\n" +
        "lives in the separate private live-state store, whose token the deployment\n" +
        "injects as LIVE_STATE_BLOB_READ_WRITE_TOKEN and which is not in .env:\n\n" +
        "  npx vercel env pull                 # or copy it from the Vercel dashboard\n" +
        '  npx dotenvx set LIVE_STATE_BLOB_READ_WRITE_TOKEN "vercel_blob_rw_..."\n\n' +
        "pass --local to export the committed seed instead.",
    );
  }
  return new Error(
    `no ${STATE_BLOB_PATH} in the store LIVE_STATE_BLOB_READ_WRITE_TOKEN points at.\n` +
      "either that is the wrong store's token, or the report has genuinely never\n" +
      "been written. pass --local to export the committed seed instead.",
  );
}

async function readState(
  opts: { local: boolean },
): Promise<{ state: Record<string, unknown>; source: string }> {
  if (opts.local) {
    return { state: await readLocalState(), source: `${STATE_FILE} (the committed seed)` };
  }

  const configured = stateBlobOptions();
  if (!configured) throw unreachable(null);

  const result = await get(STATE_BLOB_PATH, configured.blob);
  if (!result?.stream) throw unreachable(configured.via);

  return {
    state: (await new Response(result.stream).json()) as Record<string, unknown>,
    // Naming the token is what makes a surprising entry count diagnosable:
    // the store read is otherwise invisible.
    source: `Blob store ${STATE_BLOB_PATH} (via ${configured.via})`,
  };
}

/**
 * Updates the archive holds that the report doesn't.
 *
 * The report is one array inside one JSON document, so every write to it is a
 * read-modify-write that a stale read can clobber wholesale (see the header of
 * lib/report-archive.ts). Exporting is the last chance to notice, so the
 * archive gets merged back in rather than trusted to match.
 */
async function readMissingArchived(have: Set<string>): Promise<ReportEntry[]> {
  const configured = stateBlobOptions();
  if (!configured) return [];
  const blob = configured.blob;

  const pathnames: string[] = [];
  let cursor: string | undefined;
  // A long trip runs past one page, and a missed page reads as a lost update.
  do {
    const page = await list({ ...blob, prefix: ARCHIVE_PREFIX, cursor });
    pathnames.push(...page.blobs.map((b) => b.pathname));
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);

  const missing = pathnames
    .map((p) => p.slice(ARCHIVE_PREFIX.length).replace(/\.json$/, ""))
    .filter((id) => id && !have.has(id));

  const entries: ReportEntry[] = [];
  for (const id of missing) {
    try {
      const result = await get(`${ARCHIVE_PREFIX}${id}.json`, blob);
      if (!result?.stream) continue;
      const entry = (await new Response(result.stream).json()) as ReportEntry;
      // Trust the path over the payload — the path is what was asked for.
      if (entry?.date) entries.push({ ...entry, id });
    } catch (error) {
      console.error(`  could not read archived ${id}:`, error);
    }
  }
  return entries;
}

/**
 * Every update the report has, oldest first — the order a trip is read in,
 * where the live feed is newest-first because that is the update a reader came
 * back for.
 *
 * Both copies are merged, not just the state array: see readMissingArchived.
 * `source` and `recovered` are for the caller to print, because a surprising
 * entry count is only diagnosable if the store it came out of is named. The
 * whole state document comes back too: the report is one field of it, and the
 * export also wants the active trip's name off the same read.
 */
export async function collectEntries(opts: { local: boolean }): Promise<{
  entries: ReportEntry[];
  state: Record<string, unknown>;
  source: string;
  recovered: number;
}> {
  const { state, source } = await readState(opts);

  const stateEntries = (state.liveReportEntries as ReportEntry[] | undefined) ?? [];
  const archived = opts.local
    ? []
    : await readMissingArchived(new Set(stateEntries.map((e) => e.id)));

  const entries = [...stateEntries, ...archived].sort(
    (a, b) => Date.parse(a.date) - Date.parse(b.date),
  );
  return { entries, state, source, recovered: archived.length };
}

// ── Days ──────────────────────────────────────────────────────────

function zoneOf(entry: ReportEntry): string {
  if (!entry.tz) return SITE_TZ;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: entry.tz });
    return entry.tz;
  } catch {
    return SITE_TZ;
  }
}

/**
 * A day is a day where the update was written, not where the site lives — the
 * same rule /trips/live/report groups by, so the exported days line up with the
 * ones readers already saw.
 */
function dayKey(entry: ReportEntry): string {
  return new Date(entry.date).toLocaleDateString("en-CA", { timeZone: zoneOf(entry) });
}

/** e.g. "7:20 AM MDT" — the zone is the point, so it is always shown. */
export function fmtTime(entry: ReportEntry): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: zoneOf(entry),
    timeZoneName: "short",
  }).format(new Date(entry.date));
}

export interface DayGroup {
  key: string;
  entries: ReportEntry[];
}

/** Entries arrive sorted, so same-day ones are already adjacent. */
export function groupByDay(entries: ReportEntry[]): DayGroup[] {
  const groups: DayGroup[] = [];
  for (const entry of entries) {
    const key = dayKey(entry);
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.entries.push(entry);
    else groups.push({ key, entries: [entry] });
  }
  return groups;
}

/**
 * Names every photo by the day it was posted on and its position in that day,
 * deduplicated by url so the same photo posted twice uploads once. Ordered
 * names beat carrying the phone's original filename over: the source names are
 * all `IMG_0194`, which sorts by nothing anyone cares about.
 */
export function nameByUrl(groups: DayGroup[]): Map<string, string> {
  const names = new Map<string, string>();
  groups.forEach((group, dayIndex) => {
    let position = 0;
    for (const entry of group.entries) {
      for (const url of entry.images) {
        if (names.has(url)) continue;
        position += 1;
        names.set(url, `day-${dayIndex + 1}-${String(position).padStart(2, "0")}`);
      }
    }
  });
  return names;
}

/**
 * The report as published, for content/trips/<slug>.report.json.
 *
 * Carries the re-uploaded photo URLs rather than the originals, so the archive
 * and the write-up point at the same durable copies and neither is left holding
 * a url the other's upload replaced. Ordered oldest-first, as it is read.
 */
export function buildArchive(
  entries: ReportEntry[],
  resolved: Map<string, string>,
): ReportEntry[] {
  return entries.map((entry) => ({
    id: entry.id,
    date: entry.date,
    ...(entry.tz ? { tz: entry.tz } : {}),
    text: entry.text,
    images: entry.images
      .map((url) => resolved.get(url))
      .filter((url): url is string => Boolean(url)),
  }));
}
