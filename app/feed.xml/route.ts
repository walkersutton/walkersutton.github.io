import { generateRssFeed } from "@/lib/feeds";

export const dynamic = "force-static";

export async function GET() {
  const rssXml = await generateRssFeed();

  return new Response(rssXml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "s-maxage=3600, stale-while-revalidate",
    },
  });
}
