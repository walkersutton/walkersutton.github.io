"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { signToken, verifyToken } from "@/lib/admin-auth";
import { setLiveEnabled } from "@/lib/live-state";

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
