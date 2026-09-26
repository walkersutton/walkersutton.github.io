/**
 * Add `w`/`h` to the `<Img>` tags in already-written mdx.
 *
 *   pnpm backfill:img-size --dry                          # every mdx under content/
 *   pnpm backfill:img-size
 *   pnpm backfill:img-size --file content/trips/pacific-atlantic.mdx
 *
 * `pnpm img` and `pnpm export:report` emit those attributes now, so anything
 * written from here on reserves its space. Everything already committed does
 * not, and re-running the export to get them would rewrite the write-up and
 * re-point every photo (see backfill-report-archive.mts for why that is not
 * what anyone wants). So read the photos where they already are and edit the
 * tags in place.
 *
 * Each `<Img>` is fetched once — the whole point is its pixel size, which only
 * the bytes know — measured with sharp, and rewritten with `w` and `h` inserted
 * after `src`. Tags that already carry both are left alone, so this is safe to
 * re-run and cheap the second time. Video is skipped: processImage claims no
 * size for it either.
 *
 * Nothing is uploaded and no photo is modified. The only writes are to the mdx.
 *
 * Flags:
 *   --file <path>   one mdx to do, repeatable; default is all of content/
 *   --dry           report what it would change, write nothing
 */
import { existsSync } from "node:fs";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";

/** Every `<Img …/>` tag, whatever order its attributes are in. */
const IMG_TAG = /<Img\s[^>]*?\/>/g;
const SRC = /\bsrc="([^"]+)"/;
const HAS_W = /\bw="\d+"/;
const HAS_H = /\bh="\d+"/;
const VIDEO = /\.(mp4|webm)(\?|$)/i;

interface Opts {
  files: string[];
  dry: boolean;
}

function parseArgs(argv: string[]): Opts {
  const opts: Opts = { files: [], dry: false };
  for (let i = 0; i < argv.length; i += 1) {
    switch (argv[i]) {
      case "--file": {
        const path = argv[i + 1];
        if (!path) throw new Error("--file needs a path");
        opts.files.push(path);
        i += 1;
        break;
      }
      case "--dry": opts.dry = true; break;
      default:
        throw new Error(`unknown argument: ${argv[i]}`);
    }
  }
  return opts;
}

async function contentFiles(): Promise<string[]> {
  const entries = await readdir("content", { recursive: true });
  return entries
    .filter((entry) => /\.mdx?$/.test(entry))
    .map((entry) => join("content", entry))
    .sort();
}

/**
 * The bytes behind a src. A blob url is fetched; a site-relative one is read
 * out of public/, which is where it is served from.
 */
async function load(src: string): Promise<Buffer> {
  if (/^https?:\/\//.test(src)) {
    const res = await fetch(src, { redirect: "follow" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return Buffer.from(await res.arrayBuffer());
  }
  const path = join("public", src.replace(/^\//, ""));
  if (!existsSync(path)) throw new Error("not in public/");
  return readFile(path);
}

/** Measured once per url — the same photo is often in several tags. */
const measured = new Map<string, { width: number; height: number } | null>();

async function measure(src: string): Promise<{ width: number; height: number } | null> {
  const cached = measured.get(src);
  if (cached !== undefined) return cached;

  let size: { width: number; height: number } | null = null;
  try {
    const meta = await sharp(await load(src)).metadata();
    // An animated gif's `height` is every frame stacked; one frame is what a
    // reader sees, and pageHeight is that.
    const height = meta.pageHeight ?? meta.height;
    if (meta.width && height) size = { width: meta.width, height };
  } catch (err) {
    console.error(`  could not measure ${src}: ${err instanceof Error ? err.message : err}`);
  }
  measured.set(src, size);
  return size;
}

interface FileResult {
  added: number;
  already: number;
  skipped: number;
  failed: number;
  body: string;
}

async function annotate(body: string): Promise<FileResult> {
  const result: FileResult = { added: 0, already: 0, skipped: 0, failed: 0, body };

  // Collect first, then rewrite: the measuring is async and a replacer cannot
  // be, and doing it in one pass would also re-scan text we just lengthened.
  //
  // Note IMG_TAG carries /g, so it keeps a lastIndex. Never .test() with it —
  // matchAll inherits that position and quietly starts past the first tag.
  const tags = [...body.matchAll(IMG_TAG)].map((m) => m[0]);
  if (tags.length === 0) return result;

  // Identical tags are one measurement and one rewrite, but the counts are of
  // tags on the page: saying "3 sized" for 30 changed lines is just wrong.
  const occurrences = new Map<string, number>();
  for (const tag of tags) occurrences.set(tag, (occurrences.get(tag) ?? 0) + 1);

  const rewrites = new Map<string, string>();

  for (const [tag, count] of occurrences) {
    if (HAS_W.test(tag) && HAS_H.test(tag)) {
      result.already += count;
      continue;
    }
    const src = SRC.exec(tag)?.[1];
    if (!src || VIDEO.test(src)) {
      result.skipped += count;
      continue;
    }
    const size = await measure(src);
    if (!size) {
      result.failed += count;
      continue;
    }
    // After src, where the export and `pnpm img` both put them.
    rewrites.set(tag, tag.replace(SRC, `src="${src}" w="${size.width}" h="${size.height}"`));
    result.added += count;
  }

  for (const [from, to] of rewrites) result.body = result.body.split(from).join(to);
  return result;
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const files = opts.files.length > 0 ? opts.files : await contentFiles();

  let touched = 0;
  const totals = { added: 0, already: 0, skipped: 0, failed: 0 };

  for (const file of files) {
    if (!existsSync(file)) {
      console.error(`${file} does not exist`);
      process.exitCode = 1;
      continue;
    }
    const body = await readFile(file, "utf8");
    const res = await annotate(body);
    totals.added += res.added;
    totals.already += res.already;
    totals.skipped += res.skipped;
    totals.failed += res.failed;
    if (res.added === 0) continue;

    console.log(
      `${file}  +${res.added} sized` +
        (res.already ? `, ${res.already} already` : "") +
        (res.skipped ? `, ${res.skipped} skipped` : "") +
        (res.failed ? `, ${res.failed} unreadable` : ""),
    );
    if (!opts.dry) await writeFile(file, res.body);
    touched += 1;
  }

  const verb = opts.dry ? "would size" : "sized";
  console.log(
    `\n${verb} ${totals.added} <Img> across ${touched} file(s)` +
      `  (${totals.already} already sized, ${totals.skipped} skipped, ${totals.failed} unreadable)`,
  );
  if (opts.dry && totals.added > 0) console.log("dry run — nothing written");
  // An unreadable photo is a url that no longer resolves, which is worth
  // knowing about on its own.
  if (totals.failed > 0) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
