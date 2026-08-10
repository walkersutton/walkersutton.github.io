import { getLiveReportEntries, setLiveReportEntries } from "./live-state";
import { isEncrypted } from "./env";

/**
 * Backfill for trip-report photos uploaded before the admin editor started
 * downscaling them in the browser. Those went to Blob at full camera
 * resolution — several megabytes each — and every reader of the report, plus
 * every load of /admin/report, pulled the original down. This re-encodes them
 * in place and repoints the live state at the smaller copies.
 *
 * It runs server-side, in batches, so it can be driven from the phone that
 * posted the photos in the first place: the originals never leave Vercel's
 * network, and no batch outstays a function's time limit.
 */

/** Long edge, in pixels. Matches the browser-side downscale on new uploads. */
const MAX_EDGE = 1600;
const QUALITY = 82;
/** At or under this a photo is already cheap to serve. */
const SKIP_BYTES = 400 * 1024;

export type ShrinkResult = {
  /** Photos replaced with a smaller copy in this pass. */
  converted: number;
  /** Bytes saved on every future read of the report. */
  saved: number;
  /** Oversized photos left after this pass, as far as file size can tell. */
  remaining: number;
};

function blobToken(): string {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token || isEncrypted(token)) {
    throw new Error(
      "No Blob token available, so photos can't be rewritten. Set BLOB_READ_WRITE_TOKEN in the deployment environment.",
    );
  }
  return token;
}

/** "…/IMG_0194-S8Moew….jpg" → "IMG_0194"; Blob adds a fresh suffix on write. */
function baseName(url: string): string {
  const name = decodeURIComponent(new URL(url).pathname).split("/").pop() || "photo";
  return name.replace(/\.[^.]+$/, "").replace(/-[A-Za-z0-9]{20,}$/, "");
}

function isGif(url: string): boolean {
  return /\.gif$/i.test(new URL(url).pathname);
}

/**
 * Shrink up to `limit` photos, largest first, and rewrite the state to match.
 * Safe to call repeatedly: a photo that has already been converted is under the
 * size threshold and won't be picked up again. Call until `converted` is 0.
 */
export async function shrinkReportPhotos(limit = 4): Promise<ShrinkResult> {
  const token = blobToken();
  const { head, put } = await import("@vercel/blob");
  const sharp = (await import("sharp")).default;

  const entries = await getLiveReportEntries();
  const urls = [...new Set(entries.flatMap((entry) => entry.images))];

  // head() reports a blob's size without downloading it, so working out what
  // needs doing costs nothing in data transfer — which is the whole point here.
  const oversized: { url: string; size: number }[] = [];
  for (const url of urls) {
    // A canvas or sharp round trip would drop a GIF's animation.
    if (isGif(url)) continue;
    try {
      const meta = await head(url, { token });
      if (meta.size > SKIP_BYTES) oversized.push({ url, size: meta.size });
    } catch {
      // A URL that no longer resolves is stale state, not a reason to fail.
    }
  }
  oversized.sort((a, b) => b.size - a.size);

  const replacements = new Map<string, string>();
  let saved = 0;

  for (const { url } of oversized.slice(0, limit)) {
    const response = await fetch(url);
    if (!response.ok) continue;
    const input = Buffer.from(await response.arrayBuffer());

    const body = await sharp(input)
      .rotate() // honour EXIF orientation before the tag is stripped
      .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: "inside", withoutEnlargement: true })
      .webp({ quality: QUALITY })
      .toBuffer();

    // An already-optimised file can come out larger; leave it as it is. It
    // stays above the threshold, so the caller's loop ends on a pass that
    // converts nothing rather than churning on it forever.
    if (body.byteLength >= input.byteLength) continue;

    const blob = await put(`${baseName(url)}.webp`, body, {
      access: "public",
      addRandomSuffix: true,
      token,
      // Blob URLs are immutable, so there's nothing to gain from the default
      // one-month edge cache expiring and re-billing the transfer.
      cacheControlMaxAge: 365 * 24 * 60 * 60,
    });
    replacements.set(url, blob.url);
    saved += input.byteLength - body.byteLength;
  }

  if (replacements.size > 0) {
    // Re-read rather than reusing the list from the top of this call: the trip
    // is live, and an update published while we were converting must survive.
    const fresh = await getLiveReportEntries();
    await setLiveReportEntries(
      fresh.map((entry) => ({
        ...entry,
        images: entry.images.map((url) => replacements.get(url) ?? url),
      })),
    );
  }

  // The originals stay in the store. Nothing points at them any more, and
  // storage is not what the free tier runs out of — but it does mean a bad
  // conversion can be undone by putting the old URL back.
  return {
    converted: replacements.size,
    saved,
    remaining: Math.max(0, oversized.length - replacements.size),
  };
}
