import { cookies, headers } from "next/headers";
import { describeToken, SESSION_COOKIE_OPTIONS } from "@/lib/admin-auth";

// Deliberately a route handler, not a page: pages under /admin are wrapped by
// the layout's auth gate, which would replace this with the login form exactly
// when it is needed. Reports only whether a cookie arrived and why it was
// rejected — never the token, the MAC, or the signing secret.
export const dynamic = "force-dynamic";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function row(label: string, value: string, bad = false): string {
  return `<tr><th>${escapeHtml(label)}</th><td${bad ? ' class="bad"' : ""}>${escapeHtml(value)}</td></tr>`;
}

function formatAge(issuedAt: Date): string {
  const seconds = Math.round((Date.now() - issuedAt.getTime()) / 1000);
  if (Math.abs(seconds) < 60) return `${seconds}s ago`;
  if (Math.abs(seconds) < 3600) return `${Math.round(seconds / 60)}m ago`;
  if (Math.abs(seconds) < 86400) return `${Math.round(seconds / 3600)}h ago`;
  return `${Math.round(seconds / 86400)}d ago`;
}

export async function GET() {
  const [store, head] = await Promise.all([cookies(), headers()]);
  const token = store.get("admin_session")?.value;
  const diagnosis = describeToken(token);

  const host = head.get("x-forwarded-host") ?? head.get("host") ?? "(unknown)";
  const proto = head.get("x-forwarded-proto") ?? "(unknown)";
  const names = store.getAll().map((c) => c.name);

  // The session cookie is written with `secure` in production, and a browser
  // refuses to store a secure cookie sent over plain http. If that is how the
  // page is being served, sign-in cannot stick no matter what else is correct.
  // Localhost is exempt: browsers treat it as a trusted origin and will store a
  // secure cookie there over http, so flagging it would be a false alarm.
  const isLocalhost = /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(host);
  const secureMismatch = SESSION_COOKIE_OPTIONS.secure && proto === "http" && !isLocalhost;

  const rows = [
    row("Verdict", diagnosis.verdict, !diagnosis.ok),
    row("Session cookie received", token ? "yes" : "no", !token),
    row("Host seen by server", host),
    row("Protocol seen by server", proto, secureMismatch),
    row("Cookie path in use", SESSION_COOKIE_OPTIONS.path),
    row("Cookies received (names only)", names.length ? names.join(", ") : "(none)"),
    row(
      "Duplicate session cookies",
      names.filter((n) => n === "admin_session").length > 1
        ? "yes — two cookies share this name, so the wrong one may win"
        : "no",
      names.filter((n) => n === "admin_session").length > 1,
    ),
    diagnosis.issuedAt
      ? row("Issued", `${diagnosis.issuedAt.toISOString()} (${formatAge(diagnosis.issuedAt)})`)
      : "",
    secureMismatch
      ? row(
          "Problem",
          "This page is being served over http, but the session cookie is marked secure — the browser will discard it on every sign-in.",
          true,
        )
      : "",
  ].join("");

  const html = `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Admin session check</title>
<style>
  body { font: 15px/1.5 -apple-system, system-ui, sans-serif; margin: 0; padding: 20px; }
  h1 { font-size: 17px; margin: 0 0 4px; }
  p.sub { margin: 0 0 18px; color: #666; font-size: 13px; }
  table { border-collapse: collapse; width: 100%; }
  th, td { text-align: left; vertical-align: top; padding: 9px 0; border-bottom: 1px solid #e5e5e5; }
  th { width: 42%; font-weight: 600; color: #444; padding-right: 12px; }
  td { overflow-wrap: anywhere; }
  td.bad { color: #c0392b; font-weight: 600; }
  a { display: inline-block; margin-top: 20px; }
  @media (prefers-color-scheme: dark) {
    body { background: #111; color: #eee; }
    th { color: #bbb; } p.sub { color: #999; }
    th, td { border-bottom-color: #2a2a2a; }
    td.bad { color: #ff6b5a; }
  }
</style>
</head><body>
<h1>Admin session check</h1>
<p class="sub">What this server sees for the request you just made.</p>
<table>${rows}</table>
<a href="/admin">Back to /admin</a>
</body></html>`;

  return new Response(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}
