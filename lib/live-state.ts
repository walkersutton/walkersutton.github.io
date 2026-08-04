import fs from "fs";
import path from "path";
import type { InstagramAccount, SocialPost } from "./social-latest";
import { DEFAULT_LATEST_TEMPLATES, type LatestTemplates } from "./latest-templates";
import { isEncrypted } from "./env";

const STATE_FILE = path.join(process.cwd(), "data", "live-state.json");
const STATE_BLOB_PATH = "live-state.json";
const DEFAULT_BANNER_TEXT = "Walker is currently on trail";
const DEFAULT_BLUESKY_HANDLE = "walkersutton.com";

export type LiveReportEntry = { id: string; date: string; text: string; images: string[] };

type LiveState = { enabled: boolean; bannerEnabled?: boolean; bannerText?: string; bannerLink?: string; latestText?: string; latestHref?: string; activeTripName?: string; socialLatestPosts?: SocialPost[]; youtubeChannelId?: string; blueskyHandle?: string; instagramAccounts?: InstagramAccount[]; latestTemplates?: Partial<LatestTemplates>; liveReportEntries?: LiveReportEntry[]; mapShareFeedUrl?: string; mapShareStartDate?: string };

// State lives in the private "live-state" Blob store (the deployment
// filesystem is ephemeral, so admin writes must go somewhere durable). The
// committed data/live-state.json is the seed when the store is empty, and the
// store of record when no token is configured (plain local dev). The state
// includes Instagram access tokens, so it must never move to a public store.
function blobOptions(): { access: "private"; token: string } | null {
  // A dedicated "live-state" store injects LIVE_STATE_BLOB_READ_WRITE_TOKEN;
  // Vercel's default Blob integration injects BLOB_READ_WRITE_TOKEN. Accept
  // either, preferring the dedicated store. Reading only the prefixed name
  // meant a deployment carrying just the default token found no store at all,
  // so every admin write fell through to the fs.writeFileSync below and died
  // against Vercel's read-only filesystem. Blobs are written with
  // access: "private" either way, so sharing the default store still keeps the
  // Instagram tokens in this state out of public reach.
  const token =
    process.env.LIVE_STATE_BLOB_READ_WRITE_TOKEN ?? process.env.BLOB_READ_WRITE_TOKEN;
  // A value that is still dotenvx ciphertext never decrypted at runtime.
  // Passing it to the Blob SDK only yields "Invalid token: unable to extract
  // store ID", which says nothing about the real misconfiguration.
  if (!token || isEncrypted(token)) return null;
  return { access: "private", token };
}

function readLocalState(): LiveState {
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, "utf-8")) as LiveState;
  } catch {
    return { enabled: false };
  }
}

// Returns null when the store has no state yet; throws on auth/network errors.
async function readBlobState(opts: { access: "private"; token: string }): Promise<LiveState | null> {
  const { get } = await import("@vercel/blob");
  const result = await get(STATE_BLOB_PATH, opts);
  if (!result?.stream) return null;
  return (await new Response(result.stream).json()) as LiveState;
}

async function readState(): Promise<LiveState> {
  const opts = blobOptions();
  if (opts) {
    try {
      const state = await readBlobState(opts);
      if (state) return state;
    } catch {
      // Render from the committed seed rather than erroring the page.
    }
  }
  return readLocalState();
}

async function writeState(patch: Partial<LiveState>): Promise<void> {
  const opts = blobOptions();
  if (opts) {
    // Unlike readState, blob errors propagate here: silently writing to the
    // local file on Vercel would drop the update on the next cold start.
    const current = (await readBlobState(opts)) ?? readLocalState();
    const { put } = await import("@vercel/blob");
    await put(STATE_BLOB_PATH, JSON.stringify({ ...current, ...patch }, null, 2), {
      ...opts,
      allowOverwrite: true,
      contentType: "application/json",
    });
    return;
  }
  // No store configured. Locally the committed JSON is the store of record, so
  // writing it is correct. On Vercel the filesystem is read-only: the write
  // throws EROFS, which surfaces to the admin as a generic server-action error
  // that looks like the save simply did nothing. Say what's actually wrong.
  if (process.env.VERCEL) {
    throw new Error(
      "No Blob store is configured, so admin changes cannot be saved. Set " +
        "BLOB_READ_WRITE_TOKEN (or LIVE_STATE_BLOB_READ_WRITE_TOKEN) in the " +
        "deployment environment.",
    );
  }
  fs.writeFileSync(STATE_FILE, JSON.stringify({ ...readLocalState(), ...patch }, null, 2));
}

export async function getLiveEnabled(): Promise<boolean> {
  return (await readState()).enabled ?? !!process.env.GARMIN_MAPSHARE_KML_URL;
}

export async function setLiveEnabled(enabled: boolean): Promise<void> {
  await writeState({ enabled });
}

export async function getBannerEnabled(): Promise<boolean> {
  return (await readState()).bannerEnabled ?? false;
}

export async function setBannerEnabled(bannerEnabled: boolean): Promise<void> {
  await writeState({ bannerEnabled });
}

export async function getBannerText(): Promise<string> {
  return (await readState()).bannerText ?? DEFAULT_BANNER_TEXT;
}

export async function setBannerText(bannerText: string): Promise<void> {
  await writeState({ bannerText });
}

export async function getBannerLink(): Promise<string> {
  return (await readState()).bannerLink ?? "/";
}

export async function setBannerLink(bannerLink: string): Promise<void> {
  await writeState({ bannerLink });
}

export async function getLatestOverride(): Promise<{ text: string; href: string } | null> {
  const { latestText, latestHref } = await readState();
  if (latestText && latestHref) return { text: latestText, href: latestHref };
  return null;
}

export async function setLatestOverride(latestText: string, latestHref: string): Promise<void> {
  await writeState({ latestText, latestHref });
}

export async function getActiveTripName(): Promise<string> {
  return (await readState()).activeTripName ?? "Active Trip";
}

export async function setActiveTripName(activeTripName: string): Promise<void> {
  await writeState({ activeTripName });
}

export async function getSocialLatestPosts(): Promise<SocialPost[]> {
  return (await readState()).socialLatestPosts ?? [];
}

export async function setSocialLatestPosts(socialLatestPosts: SocialPost[]): Promise<void> {
  await writeState({ socialLatestPosts });
}

export async function getSocialLatest(): Promise<{ text: string; href: string; publishedAt: string } | null> {
  const posts = await getSocialLatestPosts();
  if (!posts.length) return null;

  const top = [...posts].sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))[0];
  return { text: top.text, href: top.href, publishedAt: top.publishedAt };
}

export async function getLiveReportEntries(): Promise<LiveReportEntry[]> {
  const entries = (await readState()).liveReportEntries ?? [];
  return [...entries].sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
}

export async function setLiveReportEntries(liveReportEntries: LiveReportEntry[]): Promise<void> {
  await writeState({ liveReportEntries });
}

/**
 * Set from /admin so the feed can be changed from a phone without touching the
 * deployment environment. Takes precedence over GARMIN_MAPSHARE_KML_URL.
 */
export async function getMapShareFeedUrl(): Promise<string | null> {
  return (await readState()).mapShareFeedUrl?.trim() || null;
}

export async function setMapShareFeedUrl(mapShareFeedUrl: string): Promise<void> {
  await writeState({ mapShareFeedUrl: mapShareFeedUrl.trim() });
}

/**
 * Trip start as YYYY-MM-DD. Becomes the feed's d1 bound, so the map shows the
 * whole trip rather than a rolling window that would truncate a long one.
 */
export async function getMapShareStartDate(): Promise<string | null> {
  return (await readState()).mapShareStartDate?.trim() || null;
}

export async function setMapShareStartDate(mapShareStartDate: string): Promise<void> {
  await writeState({ mapShareStartDate: mapShareStartDate.trim() });
}

export async function getYouTubeChannelId(): Promise<string | null> {
  return (await readState()).youtubeChannelId ?? null;
}

export async function setYouTubeChannelId(youtubeChannelId: string): Promise<void> {
  await writeState({ youtubeChannelId });
}

export async function getBlueskyHandle(): Promise<string | null> {
  return (await readState()).blueskyHandle ?? DEFAULT_BLUESKY_HANDLE;
}

export async function setBlueskyHandle(blueskyHandle: string): Promise<void> {
  await writeState({ blueskyHandle });
}

export async function getInstagramAccounts(): Promise<InstagramAccount[]> {
  return (await readState()).instagramAccounts ?? [];
}

export async function setInstagramAccounts(instagramAccounts: InstagramAccount[]): Promise<void> {
  await writeState({ instagramAccounts });
}

export async function getLatestTemplates(): Promise<LatestTemplates> {
  return { ...DEFAULT_LATEST_TEMPLATES, ...(await readState()).latestTemplates };
}

export async function setLatestTemplates(latestTemplates: LatestTemplates): Promise<void> {
  await writeState({ latestTemplates });
}
