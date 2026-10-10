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
 * through the same pipeline as `pnpm img`, and writes two files:
 *
 *   content/trips/<slug>.mdx          the write-up, to edit into shape
 *   content/trips/<slug>.report.json  the updates verbatim, rendered at
 *                                     /trips/<slug>/log and not edited
 *
 * The mdx becomes whatever the trip is written up as; the json stays what was
 * actually typed on the day, timestamps and zones and all, because the live
 * feed's store holds one trip at a time and loses this one the day the next
 * trip starts.
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
 * Reading the store, grouping the days and naming the photos live in
 * scripts/lib/report-store.mts, shared with backfill-report-archive.mts, which
 * joins onto the names this script's exports have already written. Still not
 * lib/live-state.ts, though it duplicates some of it: that module's relative
 * imports carry no file extension, which Node's ESM resolver won't resolve when
 * it runs a .mts file directly.
 */
import { put } from "@vercel/blob";
import { existsSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { type Dimensions, KB, processImage } from "./lib/image.mts";
import { isInteractive, paint, select, text } from "./lib/prompt.mts";
import {
  buildArchive,
  collectEntries,
  type DayGroup,
  fmtTime,
  groupByDay,
  nameByUrl,
  type ReportEntry,
} from "./lib/report-store.mts";

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

/**
 * `w`/`h` are the size the photo came out of the pipeline at, so the browser
 * reserves its space instead of laying out a zero-height box that grows when
 * the bytes land. See ProseImage. `--reuse-urls` never opens the photos, so
 * there is nothing honest to claim and the attributes are left off.
 */
function imgTag(url: string, sizes: Map<string, Dimensions>, indent = ""): string {
  const size = sizes.get(url);
  const dims = size ? ` w="${size.width}" h="${size.height}"` : "";
  return `${indent}<Img src="${url}"${dims} alt="" />`;
}

/** One photo stands alone; several become a gallery, as `pnpm img` emits. */
function imageBlock(urls: string[], sizes: Map<string, Dimensions>): string {
  if (urls.length === 1) return imgTag(urls[0], sizes);
  return `<Gallery>\n${urls.map((url) => imgTag(url, sizes, "  ")).join("\n")}\n</Gallery>`;
}

/** Bare where yaml reads it back unchanged, quoted where it wouldn't. */
function yamlValue(value: string): string {
  return /^[A-Za-z0-9][^:#\n]*[^:#\s]$/.test(value) ? value : JSON.stringify(value);
}

function buildMdx(
  groups: DayGroup[],
  resolved: Map<string, string>,
  sizes: Map<string, Dimensions>,
  opts: Opts,
): string {
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
      if (urls.length > 0) lines.push(imageBlock(urls, sizes), "");
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
  const { entries, state, source, recovered } = await collectEntries(opts);
  console.log(`reading ${source}`);
  if (recovered > 0) {
    console.log(`  recovered ${recovered} update(s) the report had lost but the archive kept`);
  }

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
  const archivePath = join("content", "trips", `${opts.slug}.report.json`);
  const uploads = !opts.reuseUrls && !opts.dry;
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
  if (uploads && (!blobToken || blobToken.startsWith("encrypted:"))) {
    console.error("\nBLOB_READ_WRITE_TOKEN missing — expected it in .env.local");
    process.exitCode = 1;
    return;
  }

  // Phase 3 — fetch, re-encode and upload every photo. Nothing on disk yet.
  const resolved = new Map<string, string>();
  // Keyed by the url the mdx ends up pointing at, which is what imgTag has.
  const sizes = new Map<string, Dimensions>();
  if (opts.reuseUrls) {
    for (const url of names.keys()) resolved.set(url, url);
    console.log("\nkeeping the photos where they are");
  } else {
    console.log("");
    for (const [url, name] of names) {
      const ext = extname(new URL(url).pathname).toLowerCase();
      const input = await fetchPhoto(url);
      const { body, ext: outExt, size } = await processImage(input, ext, {
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
      if (size) sizes.set(blob.url, size);
    }
  }

  // Phase 4 — write the mdx, now that every photo resolved.
  const mdx = buildMdx(groups, resolved, sizes, opts);

  if (opts.dry) {
    console.log(`\n${mdx}`);
    console.log(`dry run — nothing uploaded, ${outPath} and ${archivePath} not written`);
    return;
  }

  await writeFile(outPath, mdx);
  // The mdx gets edited into a write-up; this stays as it was published, and
  // /trips/<slug>/log renders it.
  await writeFile(archivePath, `${JSON.stringify(buildArchive(entries, resolved), null, 2)}\n`);
  console.log(`\nwrote ${outPath}`);
  console.log(`wrote ${archivePath}  ${entries.length} updates, verbatim`);
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
