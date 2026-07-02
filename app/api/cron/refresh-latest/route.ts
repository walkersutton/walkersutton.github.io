import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { refreshSocialLatest } from "@/lib/social-latest";

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const posts = await refreshSocialLatest();
  if (!posts.length) {
    return NextResponse.json({ updated: false, reason: "no source configured or reachable" });
  }

  revalidatePath("/", "layout");

  return NextResponse.json({ updated: true, count: posts.length, posts });
}
