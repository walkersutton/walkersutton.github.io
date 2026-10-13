import { isAdminSession } from "@/lib/admin-auth";

// Lets stats.walkersutton.com share this site's sign-in. Stats forwards the
// browser's session cookie here, server to server, and asks whether it's a
// live session. Only this site can answer: it holds the signing secret and the
// revocation epoch. The answer is a yes or no, never anything about the token.
export const dynamic = "force-dynamic";

export async function GET() {
  const signedIn = await isAdminSession().catch(() => false);
  return Response.json({ signedIn }, { headers: { "Cache-Control": "no-store" } });
}
