import { generateJsonFeed } from "@/lib/feeds";

export const dynamic = "force-static";

export async function GET() {
  const jsonFeed = await generateJsonFeed();

  return new Response(jsonFeed, {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "s-maxage=3600, stale-while-revalidate",
    },
  });
}
