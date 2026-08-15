import { getLiveReportEntries, replaceLiveReportPhoto } from "./live-state";
import { isEncrypted } from "./env";

/**
 * Server half of the trip-report photo backfill. Photos posted before the admin
 * editor started downscaling them went to Blob at full camera resolution, so
 * every reader of the report — and every load of /admin/report — pulled several
 * megabytes per photo out of the store.
 *
 * The re-encoding itself happens in the browser (app/admin/report/upload-images
 * .ts); this side only works out what needs doing and records the result.
 */

/** At or under this a photo is already cheap to serve. */
const SKIP_BYTES = 400 * 1024;

export type OversizedPhoto = { url: string; size: number };

function blobToken(): string {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token || isEncrypted(token)) {
    throw new Error(
      "No Blob token available, so photo sizes can't be read. Set BLOB_READ_WRITE_TOKEN in the deployment environment.",
    );
  }
  return token;
}

/**
 * Photos in the report that are worth shrinking, largest first.
 *
 * head() reports a blob's size without downloading it, so sizing up the whole
 * trip costs nothing in data transfer — which, given what this exists to fix,
 * matters more than it sounds.
 */
export async function listOversizedReportPhotos(): Promise<OversizedPhoto[]> {
  const token = blobToken();
  const { head } = await import("@vercel/blob");

  const entries = await getLiveReportEntries();
  const urls = [...new Set(entries.flatMap((entry) => entry.images))];

  const oversized: OversizedPhoto[] = [];
  for (const url of urls) {
    // A canvas round trip keeps a GIF's first frame and drops the animation.
    if (/\.gif$/i.test(new URL(url).pathname)) continue;
    try {
      const meta = await head(url, { token });
      if (meta.size > SKIP_BYTES) oversized.push({ url, size: meta.size });
    } catch {
      // A URL that no longer resolves is stale state, not a reason to fail.
    }
  }
  return oversized.sort((a, b) => b.size - a.size);
}

/**
 * Point the report at a shrunk copy of one photo.
 *
 * The swap happens against the state the write itself is merging onto, not a
 * copy read beforehand: the trip is live, converting a photo takes as long as
 * it takes over a tent's worth of signal, and an update published in that window
 * has to survive. Replacing one URL at a time also means an interrupted backfill
 * keeps everything it had already done.
 *
 * The original is left in the store. Nothing points at it any more, and storage
 * is not the quota under pressure — but it does mean a bad conversion can be
 * undone by putting the old URL back.
 */
export async function replaceReportPhoto(oldUrl: string, newUrl: string): Promise<void> {
  await replaceLiveReportPhoto(oldUrl, newUrl);
}
