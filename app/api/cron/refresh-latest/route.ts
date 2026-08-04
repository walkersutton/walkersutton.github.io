import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { refreshSocialLatest } from "@/lib/social-latest";
import { verifyCronSecret } from "@/lib/admin-auth";

export async function GET(request: Request) {
  if (!process.env.CRON_SECRET) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 503 });
  }
  if (!verifyCronSecret(request.headers.get("authorization"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const posts = await refreshSocialLatest();
  if (!posts.length) {
    return NextResponse.json({ updated: false, reason: "no source configured or reachable" });
  }

  revalidatePath("/", "layout");

  return NextResponse.json({ updated: true, count: posts.length, posts });
}
