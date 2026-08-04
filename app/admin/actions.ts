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
} from "@/lib/live-state";
import { refreshSocialLatest } from "@/lib/social-latest";
import type { InstagramAccount } from "@/lib/social-latest";
import { DEFAULT_LATEST_TEMPLATES, type LatestTemplateKey, type LatestTemplates } from "@/lib/latest-templates";

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

export async function saveBannerText(formData: FormData) {
  await assertAuth();
  const text = (formData.get("bannerText") as string | null) ?? "";
  if (text.trim()) {
    await setBannerText(text);
    revalidatePath("/", "layout");
  }
}

export async function saveBannerLink(formData: FormData) {
  await assertAuth();
  const link = (formData.get("bannerLink") as string | null)?.trim() ?? "";
  if (link) {
    await setBannerLink(link);
    revalidatePath("/", "layout");
  }
}

export async function saveActiveTripName(formData: FormData) {
  await assertAuth();
  const name = (formData.get("activeTripName") as string | null)?.trim() ?? "";
  if (name) {
    await setActiveTripName(name);
    revalidatePath("/", "layout");
  }
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

export async function publishReportEntry(formData: FormData) {
  await assertAuth();
  const text = (formData.get("text") as string | null)?.trim() ?? "";
  const images = (formData.getAll("imageUrl") as string[])
    .map((url) => url.trim())
    .filter(Boolean);
  if (!text && images.length === 0) return;

  const entries = await getLiveReportEntries();
  entries.unshift({
    id: crypto.randomUUID(),
    date: new Date().toISOString(),
    text,
    images,
  });
  await setLiveReportEntries(entries);
  revalidatePath("/trips/live/report");
  revalidatePath("/admin/report");
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
