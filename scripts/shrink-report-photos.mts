/**
 * Shrink trip-report photos that were uploaded before the admin editor started
 * downscaling them, and repoint the live state at the smaller copies.
 *
 *   pnpm shrink:report-photos           # report what would change
 *   pnpm shrink:report-photos --apply   # re-upload and rewrite the state
 *   pnpm shrink:report-photos --apply --prune   # …and delete the originals
 *
 * Photos posted from the phone used to land in Blob at full camera resolution,
 * so every reader of the trip report downloaded several megabytes per photo.
 * New uploads are handled in the browser (app/admin/report/upload-images.ts);
 * this is the one-off backfill for what is already in the store.
 *
 * Only images referenced by liveReportEntries are touched. The originals stay
 * in the store unless --prune is passed, so a bad run is recoverable by
 * restoring the previous state JSON printed below.
 */
import { del, get, put } from "@vercel/blob";
import { processImage } from "./lib/image.mts";

const MAX_EDGE = 1600;
const QUALITY = 82;
/** Anything at or under this is already cheap to serve; leave it alone. */
const SKIP_BYTES = 400 * 1024;

const STATE_BLOB_PATH = "live-state.json";

type ReportEntry = { id: string; date: string; text: string; images: string[] };
type LiveState = { liveReportEntries?: ReportEntry[] } & Record<string, unknown>;

const KB = (bytes: number) => `${Math.round(bytes / 1024)}KB`;

function blobOptions(): { access: "private"; token: string } {
  const token =
    process.env.LIVE_STATE_BLOB_READ_WRITE_TOKEN ?? process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    throw new Error(
      "No Blob token — expected LIVE_STATE_BLOB_READ_WRITE_TOKEN or BLOB_READ_WRITE_TOKEN in the environment.",
    );
  }
  return { access: "private", token };
}

/** The blob's own pathname, so the replacement lands beside the original. */
function pathnameOf(url: string): string {
  return decodeURIComponent(new URL(url).pathname.replace(/^\//, ""));
}

/** "IMG_0194-S8Moew….jpg" → "IMG_0194" — Blob adds its own suffix again. */
function baseName(pathname: string): string {
  const name = pathname.split("/").pop() ?? "photo";
  return name.replace(/\.[^.]+$/, "").replace(/-[A-Za-z0-9]{20,}$/, "");
}

async function main() {
  const apply = process.argv.includes("--apply");
  const prune = process.argv.includes("--prune");
  const opts = blobOptions();

  const result = await get(STATE_BLOB_PATH, opts);
  if (!result?.stream) {
    console.error("No live state in the Blob store — nothing to do.");
    return;
  }
  const state = (await new Response(result.stream).json()) as LiveState;
  const entries = state.liveReportEntries ?? [];

  // Same photo can appear in more than one entry; convert each blob once.
  const replacements = new Map<string, string>();
  const stale: string[] = [];
  let before = 0;
  let after = 0;

  const urls = [...new Set(entries.flatMap((entry) => entry.images))];
  for (const url of urls) {
    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`  skip ${url} — ${response.status}`);
      continue;
    }
    const input = Buffer.from(await response.arrayBuffer());
    const pathname = pathnameOf(url);
    const ext = (pathname.match(/\.[^.]+$/)?.[0] ?? "").toLowerCase();

    if (ext === ".gif" || input.byteLength <= SKIP_BYTES) {
      console.log(`  keep ${pathname}  ${KB(input.byteLength)}`);
      continue;
    }

    const { body, ext: outExt } = await processImage(input, ext, {
      width: MAX_EDGE,
      quality: QUALITY,
    });
    if (body.byteLength >= input.byteLength) {
      console.log(`  keep ${pathname}  ${KB(input.byteLength)} (already small enough)`);
      continue;
    }

    before += input.byteLength;
    after += body.byteLength;
    console.log(`  ${pathname}  ${KB(input.byteLength)} → ${KB(body.byteLength)}`);
    if (!apply) continue;

    const blob = await put(`${baseName(pathname)}${outExt}`, body, {
      access: "public",
      addRandomSuffix: true,
      // Matches the admin upload route: immutable URLs, so cache them for a
      // year instead of re-fetching from the store every month.
      cacheControlMaxAge: 365 * 24 * 60 * 60,
    });
    replacements.set(url, blob.url);
    stale.push(url);
  }

  const saved = before - after;
  console.log(
    `\n${urls.length} photo${urls.length === 1 ? "" : "s"}, ` +
      `${KB(before)} → ${KB(after)} (${KB(saved)} saved per full read of the report)`,
  );

  if (!apply) {
    console.log("Dry run — pass --apply to re-upload and rewrite the state.");
    return;
  }
  if (replacements.size === 0) return;

  // Re-read rather than reusing the copy from the top: the trip is live, and an
  // update published while this was converting must not be clobbered.
  const fresh = await get(STATE_BLOB_PATH, opts);
  if (!fresh?.stream) throw new Error("Live state vanished mid-run; nothing was rewritten.");
  const current = (await new Response(fresh.stream).json()) as LiveState;
  const rewritten = {
    ...current,
    liveReportEntries: (current.liveReportEntries ?? []).map((entry) => ({
      ...entry,
      images: entry.images.map((url) => replacements.get(url) ?? url),
    })),
  };

  await put(STATE_BLOB_PATH, JSON.stringify(rewritten, null, 2), {
    ...opts,
    allowOverwrite: true,
    contentType: "application/json",
  });
  console.log(`Rewrote ${replacements.size} URL(s) in the live state.`);

  if (prune) {
    await del(stale, { token: opts.token });
    console.log(`Deleted ${stale.length} original(s).`);
  } else {
    console.log("Originals kept. Re-run with --prune once the report looks right.");
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
