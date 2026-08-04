/**
 * Resize an image, upload it to Vercel Blob, print the MDX snippet.
 *
 *   pnpm img photo.jpg --alt "camp at anderson pass"
 *   pnpm img photo.jpg --caption "camp at anderson pass, 4,400ft"
 *   pnpm img ./olympics --dir trips        # whole folder → one <Gallery>
 *   pnpm img a.jpg b.jpg c.jpg --gallery --caption "morning" --caption "the pass"
 *   pnpm img *.jpg --dir trips --w 2000
 *   pnpm img clip.mp4 --still poster.jpg --alt "the descent"
 *
 * A directory argument expands to every image in it, sorted naturally, and
 * implies --gallery. Any file without an explicit --alt gets one derived from
 * its filename ("camp-at-anderson-pass.jpg" → "camp at anderson pass"), so
 * naming photos descriptively is all the alt-text work there is.
 *
 * Flags:
 *   --alt <text>      alt text; repeat to set one per file, positionally
 *   --caption <text>  visible caption; repeat to set one per file
 *   --gallery         emit one <Gallery> (side-by-side grid + lightbox)
 *                     instead of one <Img> per file
 *   --no-gallery      separate <Img>s even when a directory was passed
 *   --cols <n>        gallery columns (default: file count, capped at 3)
 *   --ratio <r>       gallery thumbnails: "auto" (default, full height) or a
 *                     crop ratio like 4/3, 1/1, 3/2
 *   --dir <name>      blob folder, default "posts"
 *   --w <px>          max width, default 1600
 *   --quality <n>     webp quality, default 82
 *   --tall            portrait framing (.img-tall)
 *   --raw             skip resize/convert, upload the file as-is
 *   --dry             process and report, but don't upload
 *
 * Stills (.gif/.mp4) upload untouched except for gif downscaling; videos are
 * always passed through. HEIC is converted via macOS `sips` first, since the
 * bundled libvips has no HEIF decoder.
 */
import { put } from "@vercel/blob";
import { execFileSync } from "node:child_process";
import { readdirSync, statSync } from "node:fs";
import { basename, join } from "node:path";
import { KB, processPath, slugify } from "./lib/image.mts";

interface Opts {
  /** One entry per --alt flag; applied positionally, or to all if only one. */
  alts: string[];
  captions: string[];
  dir: string;
  width: number;
  quality: number;
  tall: boolean;
  raw: boolean;
  dry: boolean;
  /** undefined = decide from the input: a directory implies a gallery. */
  gallery?: boolean;
  cols?: number;
  ratio?: string;
  still?: string;
}

/** Extensions the pipeline in lib/image.mts knows how to handle. */
const MEDIA = new Set([
  ".jpg", ".jpeg", ".png", ".webp", ".avif", ".tif", ".tiff",
  ".gif", ".heic", ".heif", ".mp4", ".webm",
]);

const extOf = (file: string) =>
  (basename(file).match(/\.[^.]+$/)?.[0] ?? "").toLowerCase();

/** A directory expands to the media inside it, in natural filename order. */
function expandDir(dir: string): string[] {
  const files = readdirSync(dir)
    .filter((name) => !name.startsWith(".") && MEDIA.has(extOf(name)))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .map((name) => join(dir, name));
  if (files.length === 0) throw new Error(`no images in ${dir}`);
  return files;
}

/** Camera/export prefixes that carry no meaning: IMG_1234, PXL_2024…, DSC01. */
const MARKER = /^(img|image|photo|pic|dsc|dscf|dji|gopr|pxl|mvimg|screenshot|shot|vid|video|movie|untitled)$/;

/**
 * "camp-at-anderson-pass.jpg" → "camp at anderson pass".
 * Returns "" for names that are only a camera marker and counters, since a
 * literal "img 1234" alt is worse for a screen reader than none at all.
 */
function altFromFilename(file: string): string {
  const words = basename(file)
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  if (words.length > 0 && MARKER.test(words[0])) words.shift();
  // Drop counters and timestamps (4+ digits), but keep short numbers: "4 mile".
  const kept = words.filter((w) => !/^[\d.:]{4,}$/.test(w));
  return kept.some((w) => /[a-z]/.test(w)) ? kept.join(" ") : "";
}

function parseArgs(argv: string[]): { files: string[]; opts: Opts } {
  const files: string[] = [];
  const opts: Opts = {
    alts: [],
    captions: [],
    dir: "posts",
    width: 1600,
    quality: 82,
    tall: false,
    raw: false,
    dry: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    switch (arg) {
      case "--alt": opts.alts.push(argv[++i] ?? ""); break;
      case "--caption": opts.captions.push(argv[++i] ?? ""); break;
      case "--dir": opts.dir = argv[++i] ?? "posts"; break;
      case "--still": opts.still = argv[++i]; break;
      case "--w": opts.width = Number(argv[++i]); break;
      case "--quality": opts.quality = Number(argv[++i]); break;
      case "--cols": opts.cols = Number(argv[++i]); break;
      case "--ratio": opts.ratio = argv[++i]; break;
      case "--gallery": opts.gallery = true; break;
      case "--no-gallery": opts.gallery = false; break;
      case "--tall": opts.tall = true; break;
      case "--raw": opts.raw = true; break;
      case "--dry": opts.dry = true; break;
      default:
        if (arg.startsWith("--")) throw new Error(`unknown flag: ${arg}`);
        files.push(arg);
    }
  }
  return { files, opts };
}

/** A single --alt/--caption applies to the whole batch; several map by index. */
function pick(values: string[], i: number): string {
  if (values.length === 0) return "";
  if (values.length === 1) return values[0];
  return values[i] ?? "";
}

/** Explicit --alt wins; otherwise the filename supplies it. */
function resolveAlts(files: string[], opts: Opts): string[] {
  return files.map((file, i) => pick(opts.alts, i) || altFromFilename(file));
}

const esc = (s: string) => s.replace(/"/g, "&quot;");

function imgSnippet(url: string, alt: string, opts: Opts, i: number): string {
  const attrs = [`src="${url}"`, `alt="${esc(alt)}"`];
  if (opts.still) attrs.push(`still="${opts.still}"`);
  if (opts.tall) attrs.push("tall");
  const caption = pick(opts.captions, i);
  if (caption) attrs.push(`caption="${esc(caption)}"`);
  return `<Img ${attrs.join(" ")} />`;
}

function gallerySnippet(urls: string[], alts: string[], opts: Opts): string {
  const attrs = [];
  if (opts.cols) attrs.push(` cols="${opts.cols}"`);
  if (opts.ratio) attrs.push(` ratio="${opts.ratio}"`);
  const items = urls.map((url, i) => `  ${imgSnippet(url, alts[i], opts, i)}`);
  return `<Gallery${attrs.join("")}>\n${items.join("\n")}\n</Gallery>`;
}

function copyToClipboard(text: string): boolean {
  try {
    execFileSync("pbcopy", { input: text });
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const { files: args, opts } = parseArgs(process.argv.slice(2));

  if (args.length === 0) {
    console.error("usage: pnpm img <file|dir...> [--alt <text>] [--dir <name>]");
    process.exitCode = 1;
    return;
  }
  if (!opts.dry && !process.env.BLOB_READ_WRITE_TOKEN) {
    console.error("BLOB_READ_WRITE_TOKEN missing — expected it in .env.local");
    process.exitCode = 1;
    return;
  }

  let sawDir = false;
  const files = args.flatMap((arg) => {
    if (!statSync(arg).isDirectory()) return [arg];
    sawDir = true;
    return expandDir(arg);
  });
  // A folder of photos is a gallery by default; --no-gallery opts back out.
  const gallery = opts.gallery ?? (sawDir && files.length > 1);
  const alts = resolveAlts(files, opts);

  const urls: string[] = [];

  for (const file of files) {
    const { body, ext, original } = await processPath(file, opts);
    const pathname = `${opts.dir}/${slugify(basename(file))}${ext}`;
    const saved = `${KB(original)} → ${KB(body.byteLength)}`;

    if (opts.dry) {
      console.log(`  ${basename(file)}  ${saved}  (dry, would be ${pathname})`);
      urls.push(`https://blob.example/${pathname}`);
      continue;
    }

    const blob = await put(pathname, body, {
      access: "public",
      addRandomSuffix: true,
    });
    console.log(`  ${basename(file)}  ${saved}`);
    urls.push(blob.url);
  }

  const out = gallery
    ? gallerySnippet(urls, alts, opts)
    : urls.map((url, i) => imgSnippet(url, alts[i], opts, i)).join("\n\n");
  console.log(`\n${out}\n`);

  const unnamed = files.filter((_, i) => !alts[i]).map((f) => basename(f));
  if (unnamed.length > 0) {
    console.log(`no alt text for: ${unnamed.join(", ")} — fill those in`);
  }
  if (copyToClipboard(out)) console.log("copied to clipboard");
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
