"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { signToken, verifyToken } from "@/lib/admin-auth";
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
  const password = formData.get("password") as string;
  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return { error: "Wrong password." };
  }
  const store = await cookies();
  store.set("admin_session", signToken(), {
    httpOnly: true,
    sameSite: "strict",
    path: "/admin",
    maxAge: 60 * 60 * 24 * 30,
  });
  redirect("/admin");
}

export async function logout() {
  const store = await cookies();
  store.delete("admin_session");
  redirect("/admin");
}

export async function setLive(enabled: boolean) {
  await assertAuth();
  await setLiveEnabled(enabled);
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
