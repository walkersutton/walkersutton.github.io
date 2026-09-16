/**
 * Export the live trip report into a static one under content/trips.
 *
 *   pnpm export:report                       # prompts for all of it
 *   pnpm export:report --slug sf-nyc --title "SF to NYC" --region "California"
 *
 * With no --slug it reads the report first, prints what it found, and then asks
 * for the title, slug, region and the two choices below — so the common case is
 * one word to type and a few keys, and the flags are there for scripting.
 *
 * Reads every update out of the live-state Blob store, merges in anything the
 * per-update archive holds that the state array has lost, re-uploads each photo
 * through the same pipeline as `pnpm img`, and writes content/trips/<slug>.mdx.
 *
 * Flags:
 *   --slug <name>     output slug; content/trips/<slug>.mdx. Passing it is what
 *                     turns the prompts off
 *   --title <text>    frontmatter title, default: the active trip name
 *   --region <text>   frontmatter region
 *   --reuse-urls      keep each photo's existing URL; skip fetch/resize/upload
 *   --no-times        drop the posting times instead of keeping them as
 *                     invisible mdx comments
 *   --local           read data/live-state.json instead of the Blob store
 *   --w <px>          max width, default 1600
 *   --quality <n>     webp quality, default 82
 *   --force           overwrite an existing <slug>.mdx
 *   --dry             process and report, but don't upload or write
 *
 * Uploads all happen before anything is written to disk, so a failure part-way
 * through can't leave the mdx pointing at photos that were never uploaded.
 *
 * Deliberately self-contained rather than importing lib/live-state.ts: that
 * module's relative imports carry no file extension, which Node's ESM resolver
 * won't resolve when it runs a .mts file directly.
 */
import { get, list, put } from "@vercel/blob";
import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { KB, processImage } from "./lib/image.mts";
import { isInteractive, paint, select, text } from "./lib/prompt.mts";

/** Mirrors LiveReportEntry in lib/live-state.ts. */
interface ReportEntry {
  id: string;
  date: string;
  text: string;
  images: string[];
  /** IANA zone the update was posted from; absent on older entries. */
  tz?: string;
}

interface Opts {
  slug: string;
  title: string;
  region: string;
  width: number;
  quality: number;
  reuseUrls: boolean;
  times: boolean;
  local: boolean;
  force: boolean;
  dry: boolean;
}

type BlobOptions = { access: "private"; token: string };

const STATE_FILE = join("data", "live-state.json");
const STATE_BLOB_PATH = "live-state.json";
const ARCHIVE_PREFIX = "report-entries/";
/** SITE_CONFIG.timeZone — the fallback for entries posted before `tz` existed. */
const SITE_TZ = "America/Los_Angeles";

// ── Reading the report ────────────────────────────────────────────

/**
 * Same store and same token preference as lib/live-state.ts: the dedicated
 * live-state store when it is configured, Vercel's default Blob store
 * otherwise. A value that is still dotenvx ciphertext never decrypted and is
 * no more usable than a missing one.
 */
function stateBlobOptions(): BlobOptions | null {
  const token =
    process.env.LIVE_STATE_BLOB_READ_WRITE_TOKEN ?? process.env.BLOB_READ_WRITE_TOKEN;
  if (!token || token.startsWith("encrypted:")) return null;
  return { access: "private", token };
}

async function readLocalState(): Promise<Record<string, unknown>> {
  return JSON.parse(await readFile(STATE_FILE, "utf8"));
}

/**
 * The committed data/live-state.json is only the seed the store was first
 * filled from, so falling back to it silently would export a months-old trip
 * as if it were the real one. Every fallback says so in `source`.
 */
async function readState(
  opts: Opts,
): Promise<{ state: Record<string, unknown>; source: string }> {
  if (opts.local) return { state: await readLocalState(), source: STATE_FILE };

  const blob = stateBlobOptions();
  if (!blob) {
    return {
      state: await readLocalState(),
      source: `${STATE_FILE} — no Blob token in env, so this is the committed seed, NOT the live report`,
    };
  }

  const result = await get(STATE_BLOB_PATH, blob);
  if (!result?.stream) {
    return {
      state: await readLocalState(),
      source: `${STATE_FILE} — the Blob store is empty, so this is the committed seed`,
    };
  }
  return {
    state: (await new Response(result.stream).json()) as Record<string, unknown>,
    source: `Blob store ${STATE_BLOB_PATH}`,
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
  const blob = stateBlobOptions();
  if (!blob) return [];

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
function fmtTime(entry: ReportEntry): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: zoneOf(entry),
    timeZoneName: "short",
  }).format(new Date(entry.date));
}

interface DayGroup {
  key: string;
  entries: ReportEntry[];
}

/** Entries arrive sorted, so same-day ones are already adjacent. */
function groupByDay(entries: ReportEntry[]): DayGroup[] {
  const groups: DayGroup[] = [];
  for (const entry of entries) {
    const key = dayKey(entry);
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.entries.push(entry);
    else groups.push({ key, entries: [entry] });
  }
  return groups;
}

// ── Emitting mdx ──────────────────────────────────────────────────

/**
 * mdx reads `<` as jsx and `{` as an expression, so an update that happened to
 * type either would fail the build. Both survive as html entities, which render
 * back as the original character. Everything else an update might contain —
 * bullets, bare urls, asterisks — is markdown the report is better off keeping.
 */
function escapeMdx(text: string): string {
  return text
    .replace(/&(?=[a-zA-Z#][a-zA-Z0-9]*;)/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/\{/g, "&#123;");
}

/** Lines markdown only reads correctly as an unbroken run. */
const LIST_ITEM = /^([-*+]|\d+[.)])\s+/;

/**
 * The live report renders entry text with `white-space: pre-wrap`, where every
 * newline is a visible break; mdx collapses single newlines instead. Each line
 * becomes its own block so no break an update typed disappears — at the cost of
 * not distinguishing one blank line from two.
 *
 * A run of list items is the exception. Split into separate blocks it compiles
 * to a *loose* list — every bullet wrapped in a paragraph, and since `p` is
 * mapped to the prose Paragraph, spaced like one — so those stay together.
 */
function blocks(text: string): string[] {
  const out: string[] = [];

  for (const chunk of text.split(/\n\s*\n/)) {
    let run: string[] = [];
    const flushRun = () => {
      if (run.length > 0) out.push(run.join("\n"));
      run = [];
    };

    for (const line of chunk.split("\n").map((l) => l.trim()).filter(Boolean)) {
      if (LIST_ITEM.test(line)) {
        run.push(escapeMdx(line));
      } else {
        flushRun();
        out.push(escapeMdx(line));
      }
    }
    flushRun();
  }
  return out;
}

function imgTag(url: string, indent = ""): string {
  return `${indent}<Img src="${url}" alt="" />`;
}

/** One photo stands alone; several become a gallery, as `pnpm img` emits. */
function imageBlock(urls: string[]): string {
  if (urls.length === 1) return imgTag(urls[0]);
  return `<Gallery>\n${urls.map((url) => imgTag(url, "  ")).join("\n")}\n</Gallery>`;
}

/** Bare where yaml reads it back unchanged, quoted where it wouldn't. */
function yamlValue(value: string): string {
  return /^[A-Za-z0-9][^:#\n]*[^:#\s]$/.test(value) ? value : JSON.stringify(value);
}

function buildMdx(groups: DayGroup[], resolved: Map<string, string>, opts: Opts): string {
  const lines: string[] = [
    "---",
    `title: ${yamlValue(opts.title)}`,
    `region: ${yamlValue(opts.region)}`,
    // Nothing published until the day markers and alt text have been filled in.
    "draft: true",
    "---",
    "",
  ];

  groups.forEach((group, dayIndex) => {
    lines.push(`<DayMarker label="Day ${dayIndex + 1}" subtitle="" />`, "");

    for (const entry of group.entries) {
      // blockJS strips mdx expressions before render, so this is a note to the
      // editor of the file and invisible to readers.
      if (opts.times) lines.push(`{/* ${fmtTime(entry)} */}`, "");
      for (const block of blocks(entry.text)) lines.push(block, "");

      const urls = entry.images
        .map((url) => resolved.get(url))
        .filter((url): url is string => Boolean(url));
      if (urls.length > 0) lines.push(imageBlock(urls), "");
    }
  });

  return `${lines.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd()}\n`;
}

// ── Photos ────────────────────────────────────────────────────────

async function fetchPhoto(url: string): Promise<Buffer> {
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

/**
 * Names every photo by the day it was posted on and its position in that day,
 * deduplicated by url so the same photo posted twice uploads once. Ordered
 * names beat carrying the phone's original filename over: the source names are
 * all `IMG_0194`, which sorts by nothing anyone cares about.
 */
function nameByUrl(groups: DayGroup[]): Map<string, string> {
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

// ── CLI ───────────────────────────────────────────────────────────

function parseArgs(argv: string[]): Opts {
  const opts: Opts = {
    slug: "",
    title: "",
    region: "",
    width: 1600,
    quality: 82,
    reuseUrls: false,
    times: true,
    local: false,
    force: false,
    dry: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    switch (arg) {
      case "--slug": opts.slug = argv[++i] ?? ""; break;
      case "--title": opts.title = argv[++i] ?? ""; break;
      case "--region": opts.region = argv[++i] ?? ""; break;
      case "--w": opts.width = Number(argv[++i]); break;
      case "--quality": opts.quality = Number(argv[++i]); break;
      case "--reuse-urls": opts.reuseUrls = true; break;
      case "--times": opts.times = true; break;
      case "--no-times": opts.times = false; break;
      case "--local": opts.local = true; break;
      case "--force": opts.force = true; break;
      case "--dry": opts.dry = true; break;
      default: throw new Error(`unknown argument: ${arg}`);
    }
  }
  return opts;
}

/** "SF to NYC" → "sf-to-nyc", as a starting point for the slug prompt. */
function slugFromTitle(title: string): string {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "trip"
  );
}

/** "Aug 4 – Aug 12" from the day keys, which are already yyyy-mm-dd, local. */
function fmtRange(groups: DayGroup[]): string {
  const show = (key: string) =>
    new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" }).format(
      new Date(`${key}T12:00:00Z`),
    );
  const first = show(groups[0].key);
  const last = show(groups[groups.length - 1].key);
  return first === last ? first : `${first} – ${last}`;
}

function slugComplaint(value: string): string | null {
  if (!/^[a-z0-9][a-z0-9-]*$/.test(value)) {
    return "lowercase letters, numbers and dashes only";
  }
  return null;
}

/**
 * Everything the flags would have carried, asked for instead. Only reached when
 * no --slug was passed, and only with a TTY to ask on.
 */
async function promptForOpts(opts: Opts, fallbackTitle: string): Promise<Opts> {
  const title = await text("Title", { fallback: fallbackTitle });
  const slug = await text("Slug", {
    fallback: slugFromTitle(title),
    validate: slugComplaint,
  });
  const region = await text("Region", {
    validate: (value) => (value ? null : "needed — it shows under the title on the trip page"),
  });

  const reuseUrls = await select("Photos", [
    {
      label: "Re-upload through the image pipeline",
      value: false,
      hint: `1600px webp → trips/${slug}/`,
    },
    { label: "Keep the URLs they already have", value: true, hint: "no fetch, no upload" },
  ]);

  const times = await select("Posting times", [
    { label: "Keep them", value: true, hint: "mdx comments — invisible to readers" },
    { label: "Drop them", value: false },
  ]);

  const exists = existsSync(join("content", "trips", `${slug}.mdx`));
  const action = await select("Ready", [
    { label: "Dry run first", value: "dry", hint: "print it, upload nothing, write nothing" },
    {
      label: exists ? `Overwrite content/trips/${slug}.mdx` : `Write content/trips/${slug}.mdx`,
      value: "write",
    },
    { label: "Cancel", value: "cancel" },
  ]);
  if (action === "cancel") process.exit(0);

  return {
    ...opts,
    title,
    slug,
    region,
    reuseUrls,
    times,
    dry: action === "dry",
    force: opts.force || exists,
  };
}

async function main() {
  let opts = parseArgs(process.argv.slice(2));
  // Flags drive the whole run when a slug is given; otherwise ask for one.
  const interactive = !opts.slug;

  if (interactive && !isInteractive()) {
    console.error(
      "usage: pnpm export:report --slug <name> [--title <text>] [--region <text>] [--dry]\n" +
        "       pnpm export:report              (prompts for all of it, needs a terminal)",
    );
    process.exitCode = 1;
    return;
  }
  if (!interactive && !opts.dry && !opts.force) {
    const outPath = join("content", "trips", `${opts.slug}.mdx`);
    if (existsSync(outPath)) {
      console.error(`${outPath} already exists — pass --force to overwrite it`);
      process.exitCode = 1;
      return;
    }
  }

  // Phase 1 — collect every update, from both copies of the report.
  const { state, source } = await readState(opts);
  console.log(`reading ${source}`);

  const stateEntries = (state.liveReportEntries as ReportEntry[] | undefined) ?? [];
  const archived = opts.local
    ? []
    : await readMissingArchived(new Set(stateEntries.map((e) => e.id)));
  if (archived.length > 0) {
    console.log(`  recovered ${archived.length} update(s) the report had lost but the archive kept`);
  }

  // The report is stored and rendered newest-first; a trip report reads the
  // other way round.
  const entries = [...stateEntries, ...archived].sort(
    (a, b) => Date.parse(a.date) - Date.parse(b.date),
  );
  if (entries.length === 0) {
    console.error("no updates in the report — nothing to export");
    process.exitCode = 1;
    return;
  }

  const groups = groupByDay(entries);
  const names = nameByUrl(groups);
  console.log(
    `  ${entries.length} updates, ${groups.length} days, ${names.size} photos` +
      `  ${paint.dim(fmtRange(groups))}\n`,
  );

  // Phase 2 — settle the options, from the flags or from the prompts.
  const activeTripName = state.activeTripName as string | undefined;
  if (interactive) opts = await promptForOpts(opts, activeTripName ?? "");
  else opts.title ||= activeTripName ?? opts.slug;

  const outPath = join("content", "trips", `${opts.slug}.mdx`);
  const uploads = !opts.reuseUrls && !opts.dry;
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
  if (uploads && (!blobToken || blobToken.startsWith("encrypted:"))) {
    console.error("\nBLOB_READ_WRITE_TOKEN missing — expected it in .env.local");
    process.exitCode = 1;
    return;
  }

  // Phase 3 — fetch, re-encode and upload every photo. Nothing on disk yet.
  const resolved = new Map<string, string>();
  if (opts.reuseUrls) {
    for (const url of names.keys()) resolved.set(url, url);
    console.log("\nkeeping the photos where they are");
  } else {
    console.log("");
    for (const [url, name] of names) {
      const ext = extname(new URL(url).pathname).toLowerCase();
      const input = await fetchPhoto(url);
      const { body, ext: outExt } = await processImage(input, ext, {
        width: opts.width,
        quality: opts.quality,
      });
      const pathname = `trips/${opts.slug}/${name}${outExt}`;
      const saved = `${KB(input.byteLength)} → ${KB(body.byteLength)}`;

      if (opts.dry) {
        console.log(`  ${name}  ${saved}  (dry, would be ${pathname})`);
        resolved.set(url, `https://blob.example/${pathname}`);
        continue;
      }

      const blob = await put(pathname, body, { access: "public", addRandomSuffix: true });
      console.log(`  ${name}  ${saved}  → ${pathname}`);
      resolved.set(url, blob.url);
    }
  }

  // Phase 4 — write the mdx, now that every photo resolved.
  const mdx = buildMdx(groups, resolved, opts);

  if (opts.dry) {
    console.log(`\n${mdx}`);
    console.log(`dry run — nothing uploaded, ${outPath} not written`);
    return;
  }

  await writeFile(outPath, mdx);
  console.log(`\nwrote ${outPath}`);
  console.log("\nstill to fill in:");
  console.log(`  - <DayMarker subtitle=""> — one line per day, ${groups.length} of them`);
  console.log(`  - alt="" on ${names.size} <Img> — camera filenames carry nothing to derive it from`);
  console.log(
    `  - content/trips/${opts.slug}.geojson — distance, elevation, the date range and the map all come from it,\n` +
      "    and without it /trips shows the trip with empty stats and no date to sort on",
  );
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
