import { NextResponse } from "next/server";
import { isAdminSession } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";
// Full-size camera originals over a trailhead connection.
export const maxDuration = 60;

const BLOB_HOST_SUFFIX = ".public.blob.vercel-storage.com";

/**
 * Streams one of our own Blob photos back to the admin browser, same-origin.
 *
 * The photo backfill re-encodes existing uploads in the browser (see
 * upload-images.ts), which means reading their pixels off a canvas — and a
 * canvas fed from another origin is tainted, so toBlob() would throw unless the
 * store happens to send permissive CORS headers. Going through here removes the
 * question: the bytes arrive same-origin.
 */
export async function GET(request: Request): Promise<NextResponse> {
  if (!(await isAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const raw = new URL(request.url).searchParams.get("url");
  if (!raw) return NextResponse.json({ error: "Missing url" }, { status: 400 });

  // Admin-only, but still an authenticated fetch of an arbitrary URL if left
  // open: pin it to our own public store.
  let target: URL;
  try {
    target = new URL(raw);
  } catch {
    return NextResponse.json({ error: "Bad url" }, { status: 400 });
  }
  if (target.protocol !== "https:" || !target.hostname.endsWith(BLOB_HOST_SUFFIX)) {
    return NextResponse.json({ error: "Not a Blob URL" }, { status: 400 });
  }

  const upstream = await fetch(target, { cache: "no-store" });
  if (!upstream.ok || !upstream.body) {
    return NextResponse.json({ error: `Upstream ${upstream.status}` }, { status: 502 });
  }

  return new NextResponse(upstream.body, {
    headers: {
      "content-type": upstream.headers.get("content-type") ?? "application/octet-stream",
      // Read once, re-encoded, never wanted again.
      "cache-control": "no-store",
    },
  });
}
