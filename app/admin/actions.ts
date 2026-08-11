"use server";

import { cookies, draftMode } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { SESSION_COOKIE_OPTIONS, signToken, verifyPassword, verifyToken } from "@/lib/admin-auth";
import {
  setLiveEnabled,
  setBannerEnabled,
  setBannerText,
  setBannerLink,
  setLatestOverride,
  setActiveTripName,
  setYouTubeChannelId,
  setBlueskyHandle,
  setInstagramAccounts,
  setLatestTemplates,
  getLiveReportEntries,
  setLiveReportEntries,
  setMapShareFeedUrl,
  setMapShareStartDate,
} from "@/lib/live-state";
import { isValidTimeZone } from "@/lib/report-time";
import { refreshSocialLatest } from "@/lib/social-latest";
import type { InstagramAccount } from "@/lib/social-latest";
import { DEFAULT_LATEST_TEMPLATES, type LatestTemplateKey, type LatestTemplates } from "@/lib/latest-templates";
import type { SaveResult } from "./types";

async function assertAuth() {
  const store = await cookies();
  const token = store.get("admin_session")?.value;
  if (!token) throw new Error("Unauthorized");
  try {
    if (!verifyToken(token)) throw new Error("Unauthorized");
  } catch {
    throw new Error("Unauthorized");
  }
}

export async function login(_prev: { error?: string }, formData: FormData) {
  const password = (formData.get("password") as string | null) ?? "";
  if (!verifyPassword(password)) {
    return { error: "Wrong password." };
  }
  const store = await cookies();
  store.set("admin_session", signToken(), SESSION_COOKIE_OPTIONS);
  redirect("/admin");
}

export async function logout() {
  const store = await cookies();
  // Delete with the same path the cookie was written at: the browser keys
  // cookies by (name, domain, path), so a bare delete() emits an expiry for
  // path "/" and leaves the real /admin cookie untouched. Only one expiry can
  // be queued per cookie name here — the response cookie store is keyed by
  // name — so it has to be the one that matches SESSION_COOKIE_OPTIONS.
  store.delete({ name: "admin_session", path: SESSION_COOKIE_OPTIONS.path });
  redirect("/admin");
}

/**
 * Garmin's MapShare *page* is share.garmin.com/<name>, but the KML the map
 * needs is share.garmin.com/Feed/Share/<name>. Copying the link on a phone
 * gives you the former, so accept it and convert rather than rejecting it.
 */
function toFeedUrl(url: URL): URL {
  if (!url.hostname.endsWith("garmin.com")) return url;
  if (/^\/Feed\/Share\//i.test(url.pathname)) return url;

  const name = url.pathname.split("/").filter(Boolean).pop();
  if (!name) return url;

  const feed = new URL(url.toString());
  feed.pathname = `/Feed/Share/${name}`;
  return feed;
}

export async function saveMapShareSettings(
  _prev: { error?: string; saved?: string },
  formData: FormData,
): Promise<{ error?: string; saved?: string }> {
  await assertAuth();
  const raw = (formData.get("feedUrl") as string | null)?.trim() ?? "";
  const startDate = (formData.get("startDate") as string | null)?.trim() ?? "";

  // Empty clears it and falls back to the rolling window.
  if (startDate) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
      return { error: "Trip start must be a date, e.g. 2026-08-04." };
    }
    const parsedDate = new Date(`${startDate}T00:00:00Z`);
    if (Number.isNaN(parsedDate.getTime())) {
      return { error: "That trip start date does not exist." };
    }
    // A start in the future means the feed's window has not opened yet and
    // Garmin returns nothing, which looks exactly like a broken feed.
    if (parsedDate.getTime() > Date.now() + 24 * 60 * 60 * 1000) {
      return { error: "Trip start is in the future, so the feed would return no points." };
    }
  }

  let feedUrl = "";
  if (raw) {
    let parsed: URL;
    try {
      parsed = new URL(raw);
    } catch {
      return { error: "That is not a valid URL. It should start with https://" };
    }
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return { error: "That is not an http(s) URL." };
    }
    feedUrl = toFeedUrl(parsed).toString();
  }

  try {
    await setMapShareFeedUrl(feedUrl);
    await setMapShareStartDate(startDate);
  } catch (error) {
    return { error: (error as Error).message || "Could not save." };
  }

  revalidatePath("/", "layout");
  revalidatePath("/admin/mapshare");
  return {
    saved: [
      feedUrl ? `Feed: ${feedUrl}` : "Feed cleared — using the deployment environment.",
      startDate ? `Trip start: ${startDate}` : "Trip start cleared — using a rolling 7-day window.",
    ].join(" · "),
  };
}

export async function setLive(enabled: boolean) {
  await assertAuth();
  await setLiveEnabled(enabled);
  revalidatePath("/", "layout");
}

export async function setDraftPreview(enabled: boolean) {
  await assertAuth();
  const draft = await draftMode();
  if (enabled) draft.enable();
  else draft.disable();
  revalidatePath("/", "layout");
}

export async function setBanner(enabled: boolean) {
  await assertAuth();
  await setBannerEnabled(enabled);
  revalidatePath("/", "layout");
}

// These three report what was stored rather than returning void: an empty field
// used to be a silent no-op that left the old value on screen, which is
// indistinguishable from a save that failed.
export async function saveBannerText(_prev: SaveResult, formData: FormData): Promise<SaveResult> {
  await assertAuth();
  const text = (formData.get("bannerText") as string | null)?.trim() ?? "";
  if (!text) return { error: "Banner text can't be empty." };
  await setBannerText(text);
  revalidatePath("/", "layout");
  return { saved: text };
}

export async function saveBannerLink(_prev: SaveResult, formData: FormData): Promise<SaveResult> {
  await assertAuth();
  const link = (formData.get("bannerLink") as string | null)?.trim() ?? "";
  if (!link) return { error: "Banner link can't be empty." };
  await setBannerLink(link);
  revalidatePath("/", "layout");
  return { saved: link };
}

export async function saveActiveTripName(
  _prev: SaveResult,
  formData: FormData,
): Promise<SaveResult> {
  await assertAuth();
  const name = (formData.get("activeTripName") as string | null)?.trim() ?? "";
  if (!name) return { error: "Trip name can't be empty." };
  await setActiveTripName(name);
  revalidatePath("/", "layout");
  return { saved: name };
}

export async function saveLatestOverride(formData: FormData) {
  await assertAuth();
  const text = (formData.get("latestText") as string | null)?.trim() ?? "";
  const href = (formData.get("latestHref") as string | null)?.trim() ?? "";
  await setLatestOverride(text, href);
  revalidatePath("/");
}

export async function saveYouTubeChannelId(formData: FormData) {
  await assertAuth();
  const id = (formData.get("youtubeChannelId") as string | null)?.trim() ?? "";
  await setYouTubeChannelId(id);
  revalidatePath("/", "layout");
}

export async function saveBlueskyHandle(formData: FormData) {
  await assertAuth();
  const handle = (formData.get("blueskyHandle") as string | null)?.trim() ?? "";
  await setBlueskyHandle(handle);
  revalidatePath("/", "layout");
}

export async function refreshSocialLatestNow() {
  await assertAuth();
  await refreshSocialLatest();
  revalidatePath("/", "layout");
  revalidatePath("/admin/latest");
}

export async function saveInstagramAccounts(formData: FormData) {
  await assertAuth();
  const userIds = formData.getAll("userId") as string[];
  const accessTokens = formData.getAll("accessToken") as string[];
  const usernames = formData.getAll("username") as string[];
  const accounts: InstagramAccount[] = userIds
    .map((userId, i) => {
      const username = (usernames[i] ?? "").trim();
      return {
        userId: userId.trim(),
        accessToken: (accessTokens[i] ?? "").trim(),
        ...(username ? { username } : {}),
      };
    })
    .filter((account): account is InstagramAccount => Boolean(account.userId && account.accessToken));
  await setInstagramAccounts(accounts);
  revalidatePath("/", "layout");
}

// Returns the failure rather than throwing it: Next replaces a thrown server
// action error with an opaque digest in production, which reaches the editor as
// a generic message and reads as "the button did nothing".
export async function publishReportEntry(
  formData: FormData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await assertAuth();
  const text = (formData.get("text") as string | null)?.trim() ?? "";
  const images = (formData.getAll("imageUrl") as string[])
    .map((url) => url.trim())
    .filter(Boolean);
  if (!text && images.length === 0) return { ok: false, error: "Nothing to publish." };

  // An unrecognised zone is dropped rather than stored: rendering falls back to
  // the site zone, which is the same behaviour as an entry posted before this
  // was recorded.
  const posted = (formData.get("tz") as string | null)?.trim() ?? "";
  const tz = posted && isValidTimeZone(posted) ? posted : undefined;

  const entries = await getLiveReportEntries();
  entries.unshift({
    id: crypto.randomUUID(),
    date: new Date().toISOString(),
    text,
    images,
    tz,
  });

  try {
    await setLiveReportEntries(entries);
  } catch (error) {
    console.error("publishReportEntry: failed to persist entry", error);
    return { ok: false, error: (error as Error).message || "Could not save the update." };
  }

  revalidatePath("/trips/live/report");
  revalidatePath("/admin/report");
  return { ok: true };
}

export async function updateReportEntry(formData: FormData) {
  await assertAuth();
  const id = (formData.get("id") as string | null) ?? "";
  const text = (formData.get("text") as string | null)?.trim() ?? "";
  const images = (formData.getAll("imageUrl") as string[])
    .map((url) => url.trim())
    .filter(Boolean);
  if (!id || (!text && images.length === 0)) return;

  const entries = await getLiveReportEntries();
  const entry = entries.find((e) => e.id === id);
  if (!entry) return;

  entry.text = text;
  entry.images = images;
  // The zone an update was posted from is editable because it can be wrong:
  // entries written before it was recorded default to the site's, and a phone
  // that hasn't caught up with the ride reports the old one.
  const tz = (formData.get("tz") as string | null)?.trim() ?? "";
  if (tz && isValidTimeZone(tz)) entry.tz = tz;
  await setLiveReportEntries(entries);
  revalidatePath("/trips/live/report");
  revalidatePath("/admin/report");
}

export async function deleteReportEntry(id: string) {
  await assertAuth();
  const entries = await getLiveReportEntries();
  await setLiveReportEntries(entries.filter((e) => e.id !== id));
  revalidatePath("/trips/live/report");
  revalidatePath("/admin/report");
}

export async function clearReportEntries() {
  await assertAuth();
  await setLiveReportEntries([]);
  revalidatePath("/trips/live/report");
  revalidatePath("/admin/report");
}

/** The photos the backfill should work through (see lib/report-photos.ts). */
export async function listReportPhotosToShrink(): Promise<
  { ok: true; photos: { url: string; size: number }[] } | { ok: false; error: string }
> {
  await assertAuth();
  try {
    const { listOversizedReportPhotos } = await import("@/lib/report-photos");
    return { ok: true, photos: await listOversizedReportPhotos() };
  } catch (error) {
    console.error("listReportPhotosToShrink: failed", error);
    return { ok: false, error: (error as Error).message || "Could not list photos." };
  }
}

/** Records one converted photo. Called once per photo, so an interrupted run
 *  keeps everything it finished. */
export async function replaceReportPhotoUrl(
  oldUrl: string,
  newUrl: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await assertAuth();
  try {
    const { replaceReportPhoto } = await import("@/lib/report-photos");
    await replaceReportPhoto(oldUrl, newUrl);
    revalidatePath("/trips/live/report");
    revalidatePath("/admin/report");
    return { ok: true };
  } catch (error) {
    console.error("replaceReportPhotoUrl: failed", error);
    return { ok: false, error: (error as Error).message || "Could not save the change." };
  }
}

export async function saveLatestTemplates(formData: FormData) {
  await assertAuth();
  const keys = Object.keys(DEFAULT_LATEST_TEMPLATES) as LatestTemplateKey[];
  const templates = Object.fromEntries(
    keys.map((key) => [
      key,
      {
        prefix: (formData.get(`${key}.prefix`) as string | null) ?? "",
        content: (formData.get(`${key}.content`) as string | null) ?? "",
        suffix: (formData.get(`${key}.suffix`) as string | null) ?? "",
      },
    ]),
  ) as LatestTemplates;
  await setLatestTemplates(templates);
  revalidatePath("/", "layout");
  revalidatePath("/admin/latest");
}
