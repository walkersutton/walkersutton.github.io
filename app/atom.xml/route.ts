import { generateAtomFeed } from "@/lib/feeds";

export const dynamic = "force-static";

export async function GET() {
  const atomXml = await generateAtomFeed();

  return new Response(atomXml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "s-maxage=3600, stale-while-revalidate",
    },
  });
}
