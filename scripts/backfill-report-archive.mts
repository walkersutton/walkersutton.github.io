/**
 * Write content/trips/<slug>.report.json for a trip whose mdx was exported
 * before pnpm export:report learned to write one.
 *
 *   pnpm backfill:report --slug pacific-atlantic --dry
 *   pnpm backfill:report --slug pacific-atlantic
 *
 * The export writes two files: the mdx to edit into a write-up, and the
 * report.json that /trips/<slug>/report renders verbatim. A trip exported
 * before that second file existed has the write-up and nothing else, and
 * because getTripReportSlugs() globs *.report.json, its report page 404s and
 * the write-up shows no link to one.
 *
 * Re-running the export would fix that, but not cleanly. It writes both files
 * together, so the mdx would be regenerated too, and the photo URLs would not
 * match: with --reuse-urls the archive would point at the originals the phone
 * uploaded to /admin, and without it every photo would be re-uploaded a second
 * time under a new path. Either way the two files end up pointing at different
 * copies of the same photo.
 *
 * So this reads the updates from the same store the export reads, and resolves
 * each photo to the URL the mdx is *already* carrying, by the name the export
 * gave it: `day-1-01` and so on, from lib/report-store.mts's nameByUrl, which
 * both scripts share precisely so this join cannot drift.
 *
 * Nothing is uploaded and nothing but the one json file is written. The mdx is
 * read, never touched.
 *
 * Flags:
 *   --slug <name>   the trip; reads content/trips/<slug>.mdx, writes
 *                   content/trips/<slug>.report.json
 *   --local         read data/live-state.json instead of the Blob store. The
 *                   seed, not the trip — for proving the plumbing, not for a
 *                   real backfill
 *   --force         overwrite an existing <slug>.report.json
 *   --dry           report what it would write, then write nothing
 */
import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import {
  buildArchive,
  collectEntries,
  type DayGroup,
  groupByDay,
  nameByUrl,
  type ReportEntry,
} from "./lib/report-store.mts";

interface Opts {
  slug: string;
  local: boolean;
  force: boolean;
  dry: boolean;
}

// ── Reading the mdx ───────────────────────────────────────────────

/** Both the standalone tag and the ones a <Gallery> wraps; the markup is identical. */
const IMG_SRC = /<Img\s+src="([^"]+)"/g;

/**
 * `…/trips/pacific-to-atlantic/day-1-01-Xs48q1Q8lEmnETNVsmiyplWkW8j5FK.webp`
 * → `day-1-01`.
 *
 * The export uploads with addRandomSuffix, so the name it chose is the
 * pathname's prefix rather than the whole basename. Anything else — a photo
 * exported with --reuse-urls, or one hand-edited into the write-up later — has
 * no name to join on and is reported rather than guessed at.
 */
const EXPORT_NAME = /^(day-\d+-\d+)(?:-[^.]*)?\.[^.]+$/;

function nameOf(url: string): string | null {
  let pathname: string;
  try {
    pathname = decodeURIComponent(new URL(url).pathname);
  } catch {
    return null;
  }
  return EXPORT_NAME.exec(pathname.split("/").pop() ?? "")?.[1] ?? null;
}

interface MdxPhotos {
  /** The export's name for a photo → the URL the mdx carries for it. */
  byName: Map<string, string>;
  /** Photo URLs the export did not name, so nothing can be joined to them. */
  unnamed: string[];
  /** One name, two different URLs — the mdx is not the export this is for. */
  conflicts: string[];
  total: number;
}

function readMdxPhotos(mdx: string): MdxPhotos {
  const byName = new Map<string, string>();
  const unnamed: string[] = [];
  const conflicts: string[] = [];
  let total = 0;

  for (const [, url] of mdx.matchAll(IMG_SRC)) {
    total += 1;
    const name = nameOf(url);
    if (!name) {
      unnamed.push(url);
      continue;
    }
    const seen = byName.get(name);
    // The same photo posted twice is emitted twice under one name, which is
    // fine; two different photos under one name is not.
    if (seen && seen !== url) conflicts.push(name);
    else byName.set(name, url);
  }

  return { byName, unnamed, conflicts, total };
}

// ── Checking the two halves line up ───────────────────────────────

/** Enough of a list to recognise the problem, not the whole trip. */
function few(values: string[], limit = 8): string {
  const shown = [...new Set(values)];
  if (shown.length <= limit) return shown.join(", ");
  return `${shown.slice(0, limit).join(", ")} … and ${shown.length - limit} more`;
}

/**
 * The store holds one trip at a time and is still being written to, so the
 * report it hands back now is not guaranteed to be the one this mdx was built
 * from — an update edited or deleted since would re-letter every photo after
 * it, and the join would then file photos under the wrong updates without ever
 * failing. Every mismatch is therefore fatal, and they are collected rather
 * than thrown one at a time: told all at once, they usually say between them
 * what happened.
 */
function complaints(
  entries: ReportEntry[],
  groups: DayGroup[],
  names: Map<string, string>,
  mdx: string,
  photos: MdxPhotos,
): string[] {
  const out: string[] = [];

  const days = (mdx.match(/<DayMarker\b/g) ?? []).length;
  if (days !== groups.length) {
    out.push(`the mdx has ${days} days, the report has ${groups.length}`);
  }

  // The export writes one `{/* 7:20 AM PDT */}` per update, unless it was run
  // with --no-times, in which case there are none to compare against.
  const times = (mdx.match(/^\{\/\* .* \*\/\}$/gm) ?? []).length;
  if (times > 0 && times !== entries.length) {
    out.push(`the mdx has ${times} updates, the report has ${entries.length}`);
  }

  if (photos.conflicts.length > 0) {
    out.push(`the mdx uses one name for two different photos: ${few(photos.conflicts)}`);
  }

  if (photos.unnamed.length > 0) {
    out.push(
      `${photos.unnamed.length} photo(s) in the mdx are not named day-N-NN, so there is\n` +
        "    nothing to join them on. that is what an export run with --reuse-urls\n" +
        `    looks like:\n      ${[...new Set(photos.unnamed)].slice(0, 3).join("\n      ")}`,
    );
  }

  const missing = [...names.values()].filter((name) => !photos.byName.has(name));
  if (missing.length > 0) {
    out.push(`${missing.length} photo(s) in the report are not in the mdx: ${few(missing)}`);
  }

  const wanted = new Set(names.values());
  const extra = [...photos.byName.keys()].filter((name) => !wanted.has(name));
  if (extra.length > 0) {
    out.push(`${extra.length} photo(s) in the mdx are not in the report: ${few(extra)}`);
  }

  return out;
}

// ── CLI ───────────────────────────────────────────────────────────

function parseArgs(argv: string[]): Opts {
  const opts: Opts = { slug: "", local: false, force: false, dry: false };

  for (let i = 0; i < argv.length; i += 1) {
    switch (argv[i]) {
      case "--slug": opts.slug = argv[i + 1] ?? ""; i += 1; break;
      case "--local": opts.local = true; break;
      case "--force": opts.force = true; break;
      case "--dry": opts.dry = true; break;
      default:
        throw new Error(`unknown argument: ${argv[i]}`);
    }
  }
  return opts;
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (!opts.slug) {
    console.error(
      "usage: pnpm backfill:report --slug <name> [--local] [--force] [--dry]\n\n" +
        "writes content/trips/<slug>.report.json for a trip whose mdx was\n" +
        "exported before the export script wrote one.",
    );
    process.exitCode = 1;
    return;
  }

  const mdxPath = join("content", "trips", `${opts.slug}.mdx`);
  const outPath = join("content", "trips", `${opts.slug}.report.json`);

  if (!existsSync(mdxPath)) {
    console.error(`${mdxPath} does not exist — this backfills an export that already ran`);
    process.exitCode = 1;
    return;
  }
  if (existsSync(outPath) && !opts.force && !opts.dry) {
    console.error(`${outPath} already exists — pass --force to overwrite it`);
    process.exitCode = 1;
    return;
  }

  const { entries, source, recovered } = await collectEntries(opts);
  console.log(`reading ${source}`);
  if (recovered > 0) {
    console.log(`  recovered ${recovered} update(s) the report had lost but the archive kept`);
  }
  if (entries.length === 0) {
    console.error("no updates in the report — nothing to back up");
    process.exitCode = 1;
    return;
  }

  const groups = groupByDay(entries);
  const names = nameByUrl(groups);
  const mdx = await readFile(mdxPath, "utf8");
  const photos = readMdxPhotos(mdx);

  console.log(
    `  ${entries.length} updates, ${groups.length} days, ${names.size} photos` +
      `  ${groups[0].key} → ${groups[groups.length - 1].key}`,
  );
  console.log(`reading ${mdxPath}\n  ${photos.total} photos, ${photos.byName.size} distinct`);

  const problems = complaints(entries, groups, names, mdx, photos);
  if (problems.length > 0) {
    console.error(
      `\n${mdxPath} and the report do not describe the same trip:\n\n` +
        problems.map((p) => `  - ${p}`).join("\n") +
        "\n\nnothing written. the store holds one trip at a time, so the likeliest\n" +
        "cause is that the report has moved on — an update edited or deleted since\n" +
        "the export re-letters every photo after it, and a join made anyway would\n" +
        "file photos under the wrong updates rather than fail.",
    );
    process.exitCode = 1;
    return;
  }

  // Each photo to the URL the mdx already carries, so the archive and the
  // write-up point at the same uploaded copy.
  const resolved = new Map([...names].map(([url, name]) => [url, photos.byName.get(name)!]));
  const archive = buildArchive(entries, resolved);

  if (opts.dry) {
    console.log(`\ndry run — would write ${outPath}, ${archive.length} updates verbatim`);
    console.log(`  first  ${archive[0].date}  ${archive[0].text.split("\n")[0].slice(0, 60)}`);
    const last = archive[archive.length - 1];
    console.log(`  last   ${last.date}  ${last.text.split("\n")[0].slice(0, 60)}`);
    return;
  }

  await writeFile(outPath, `${JSON.stringify(archive, null, 2)}\n`);
  console.log(`\nwrote ${outPath}  ${archive.length} updates, verbatim`);
  console.log(`/trips/${opts.slug}/report renders it once it is committed`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
