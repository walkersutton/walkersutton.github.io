import { NextResponse } from "next/server";
import { getMapShareData } from "@/lib/mapshare-server";

export async function GET(request: Request) {
  const forceDummy = new URL(request.url).searchParams.get("sample") === "1";
  const { data, status, cacheControl } = await getMapShareData({ forceDummy });

  return NextResponse.json(data, {
    status,
    headers: { "Cache-Control": cacheControl },
  });
}
