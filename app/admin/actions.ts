"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { signToken, verifyToken } from "@/lib/admin-auth";
import { setLiveEnabled, setBannerText, setLatestOverride, setActiveTripName } from "@/lib/live-state";

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

export async function saveBannerText(formData: FormData) {
  await assertAuth();
  const text = (formData.get("bannerText") as string | null) ?? "";
  if (text.trim()) {
    await setBannerText(text);
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
