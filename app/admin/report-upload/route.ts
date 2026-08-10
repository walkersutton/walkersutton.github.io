import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

async function isAuthed(): Promise<boolean> {
  const token = (await cookies()).get("admin_session")?.value;
  if (!token) return false;
  try {
    return verifyToken(token);
  } catch {
    return false;
  }
}

// Client-upload token endpoint for the /admin report editor. iPhone photos are
// uploaded straight to Vercel Blob (bypassing the server-action body limit); we
// only mint an upload token for an authenticated admin session.
export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        if (!(await isAuthed())) throw new Error("Unauthorized");
        return {
          allowedContentTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
          addRandomSuffix: true,
          // Every URL carries a random suffix, so a blob's bytes never change
          // once written and the edge can hold onto them for as long as it
          // likes. The default is a month, after which each region's first
          // request pulls the file out of the store again and bills the
          // transfer; a year makes those re-fetches twelve times rarer.
          cacheControlMaxAge: 365 * 24 * 60 * 60,
          // The client downscales before uploading, so anything this large is a
          // photo that failed to re-encode or a file picked by mistake. Cap it
          // rather than let one upload cost gigabytes of transfer later.
          maximumSizeInBytes: 15 * 1024 * 1024,
        };
      },
      onUploadCompleted: async () => {
        // No-op: the client submits the returned URLs to the publish action.
      },
    });
    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 },
    );
  }
}
