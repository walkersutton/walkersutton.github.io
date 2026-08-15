import { stateBlobOptions, type LiveReportEntry, type StateBlobOptions } from "./live-state";

/**
 * A copy of every published update, one immutable blob per update, alongside
 * the live state in the same private store.
 *
 * The report itself lives as a single `liveReportEntries` array inside one JSON
 * document, so every write to it is a read-modify-write of the whole list. That
 * shape is fine until a read returns something stale — a blob read that failed
 * over to the committed seed, or two saves overlapping — at which point the
 * write does not lose *an* update, it replaces every update on the trip. There
 * is no version history behind `put(..., { allowOverwrite: true })`, so when
 * that happens the text is simply gone.
 *
 * Writing each update to its own path takes that risk off the critical one.
 * Nothing here is ever read-modify-written, so nothing here can be clobbered by
 * a stale read: publishing writes one new path, and only a deliberate delete
 * removes one. Whatever the state array does or doesn't contain, the archive
 * still holds what was actually published, and the difference between the two
 * is exactly the set of updates that went missing by accident.
 */

const ARCHIVE_PREFIX = "report-entries/";

function archivePath(id: string): string {
  return `${ARCHIVE_PREFIX}${id}.json`;
}

function idFromPath(pathname: string): string {
  return pathname.slice(ARCHIVE_PREFIX.length).replace(/\.json$/, "");
}

/**
 * Archiving is best-effort by design: it is a safety net, and a torn net is no
 * reason to refuse to publish. Callers log and carry on. Locally there is no
 * store and the committed JSON is already the durable copy, so this is a no-op.
 */
export async function archiveReportEntry(entry: LiveReportEntry): Promise<void> {
  const opts = stateBlobOptions();
  if (!opts) return;
  const { put } = await import("@vercel/blob");
  // Overwrite is for edits: the archive should hold the update as it currently
  // reads, not only as it was first typed.
  await put(archivePath(entry.id), JSON.stringify(entry), {
    ...opts,
    allowOverwrite: true,
    contentType: "application/json",
  });
}

/**
 * Drops an update from the archive. Only ever called for a delete the user
 * asked for — otherwise a restore would resurrect it.
 */
export async function forgetArchivedEntry(id: string): Promise<void> {
  const opts = stateBlobOptions();
  if (!opts) return;
  const { del } = await import("@vercel/blob");
  await del(archivePath(id), opts);
}

/** Empties the archive, for "clear all" — which means all of it. */
export async function forgetAllArchivedEntries(): Promise<void> {
  const opts = stateBlobOptions();
  if (!opts) return;
  const paths = (await listArchive(opts)).map((blob) => blob.pathname);
  if (paths.length === 0) return;
  const { del } = await import("@vercel/blob");
  await del(paths, opts);
}

async function listArchive(opts: StateBlobOptions) {
  const { list } = await import("@vercel/blob");
  const blobs: { pathname: string }[] = [];
  let cursor: string | undefined;
  // A long trip runs past one page of results, and a missed page reads as a
  // missing update.
  do {
    const page = await list({ ...opts, prefix: ARCHIVE_PREFIX, cursor });
    blobs.push(...page.blobs);
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return blobs;
}

/**
 * Ids of updates the archive holds but the report doesn't — accidental loss,
 * in other words. Listing returns pathnames only, so working this out costs one
 * request and downloads nothing; the entries themselves are only fetched if the
 * user actually restores them.
 */
export async function findMissingEntryIds(present: LiveReportEntry[]): Promise<string[]> {
  const opts = stateBlobOptions();
  if (!opts) return [];
  const have = new Set(present.map((entry) => entry.id));
  return (await listArchive(opts))
    .map((blob) => idFromPath(blob.pathname))
    .filter((id) => id && !have.has(id));
}

/** Reads back the named updates. Ones that no longer resolve are skipped. */
export async function readArchivedEntries(ids: string[]): Promise<LiveReportEntry[]> {
  const opts = stateBlobOptions();
  if (!opts) return [];
  const { get } = await import("@vercel/blob");

  const entries: LiveReportEntry[] = [];
  for (const id of ids) {
    try {
      const result = await get(archivePath(id), opts);
      if (!result?.stream) continue;
      const entry = (await new Response(result.stream).json()) as LiveReportEntry;
      // Trust the path over the payload: the path is what the restore was
      // asked for, and a mismatched id would insert a duplicate.
      if (entry?.date) entries.push({ ...entry, id });
    } catch (error) {
      console.error(`report-archive: could not read ${id}`, error);
    }
  }
  return entries;
}
