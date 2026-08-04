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
 * Returns the bytes to upload and the extension they should carry.
 * `ext` is the source extension, lowercased, including the dot.
 */
export async function processImage(
  input: Buffer,
  ext: string,
  opts: ProcessOpts,
): Promise<{ body: Buffer; ext: string }> {
  // Video is passed through — transcoding is out of scope.
  if (opts.raw || ext === ".mp4" || ext === ".webm") {
    return { body: input, ext };
  }

  let buf = input;
  if (ext === ".heic" || ext === ".heif") buf = await decodeHeic(buf);

  if (ext === ".gif") {
    // Keep it animated; only downscale. cgif ships with sharp's binaries.
    const body = await sharp(buf, { animated: true })
      .resize({ width: opts.width, withoutEnlargement: true })
      .gif()
      .toBuffer();
    return { body, ext: ".gif" };
  }

  const body = await sharp(buf)
    .rotate() // honor EXIF orientation before metadata is stripped
    .resize({ width: opts.width, withoutEnlargement: true })
    .webp({ quality: opts.quality })
    .toBuffer();
  return { body, ext: ".webp" };
}

/** Convenience wrapper for a path on disk. */
export async function processPath(
  file: string,
  opts: ProcessOpts,
): Promise<{ body: Buffer; ext: string; original: number }> {
  const input = await readFile(file);
  const ext = (basename(file).match(/\.[^.]+$/)?.[0] ?? "").toLowerCase();
  const { body, ext: outExt } = await processImage(input, ext, opts);
  return { body, ext: outExt, original: input.byteLength };
}
