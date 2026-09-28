/** Shared image pipeline: resize/convert bytes for upload to Vercel Blob. */
import { execFileSync } from "node:child_process";
import { readFile, writeFile, mkdtemp, rm } from "node:fs/promises";
import { basename, join } from "node:path";
import { tmpdir } from "node:os";
import sharp from "sharp";

export interface ProcessOpts {
  width: number;
  quality: number;
  /** Upload bytes untouched. */
  raw?: boolean;
}

export function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/\.[^.]+$/, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "image"
  );
}

export const KB = (bytes: number) => `${Math.round(bytes / 1024)}KB`;

/** HEIC → JPEG via macOS sips; the bundled libvips has no HEIF decoder. */
async function decodeHeic(buf: Buffer): Promise<Buffer> {
  const dir = await mkdtemp(join(tmpdir(), "img-"));
  const src = join(dir, "in.heic");
  const out = join(dir, "out.jpg");
  try {
    await writeFile(src, buf);
    execFileSync("sips", ["-s", "format", "jpeg", src, "--out", out], {
      stdio: "ignore",
    });
    return await readFile(out);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

/**
 * The rendered size of what came out, for the `<Img w h>` that will point at
 * it. Absent for passed-through video, which has no single frame size worth
 * claiming here.
 *
 * Reserving a photo's space is the whole reason these are carried around: an
 * `<img>` with no dimensions is a zero-height box until it loads, so a page of
 * lazy photos grows as it is read, and anything that scrolled into it lands
 * somewhere else. The browser only needs the ratio, which it takes from the
 * width and height attributes.
 */
export interface Dimensions {
  width: number;
  height: number;
}

export type Processed = { body: Buffer; ext: string; size?: Dimensions };

/**
 * Returns the bytes to upload, the extension they should carry, and the size
 * they came out at. `ext` is the source extension, lowercased, including the
 * dot.
 */
export async function processImage(
  input: Buffer,
  ext: string,
  opts: ProcessOpts,
): Promise<Processed> {
  // Video is passed through — transcoding is out of scope.
  if (opts.raw || ext === ".mp4" || ext === ".webm") {
    return { body: input, ext };
  }

  let buf = input;
  if (ext === ".heic" || ext === ".heif") buf = await decodeHeic(buf);

  if (ext === ".gif") {
    // Keep it animated; only downscale. cgif ships with sharp's binaries.
    const { data, info } = await sharp(buf, { animated: true })
      .resize({ width: opts.width, withoutEnlargement: true })
      .gif()
      .toBuffer({ resolveWithObject: true });
    // An animated gif's `height` is every frame stacked; one frame is what a
    // reader sees, and pageHeight is that.
    return {
      body: data,
      ext: ".gif",
      size: { width: info.width, height: info.pageHeight ?? info.height },
    };
  }

  const { data, info } = await sharp(buf)
    .rotate() // honor EXIF orientation before metadata is stripped
    .resize({ width: opts.width, withoutEnlargement: true })
    .webp({ quality: opts.quality })
    .toBuffer({ resolveWithObject: true });
  return { body: data, ext: ".webp", size: { width: info.width, height: info.height } };
}

/** Convenience wrapper for a path on disk. */
export async function processPath(
  file: string,
  opts: ProcessOpts,
): Promise<Processed & { original: number }> {
  const input = await readFile(file);
  const ext = (basename(file).match(/\.[^.]+$/)?.[0] ?? "").toLowerCase();
  const processed = await processImage(input, ext, opts);
  return { ...processed, original: input.byteLength };
}
