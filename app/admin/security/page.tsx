import { headers } from "next/headers";
import { getSession, SESSION_MAX_AGE_MS } from "@/lib/admin-auth";
import { SITE_CONFIG } from "@/lib/config";
import { getAuthState } from "@/lib/live-state";
import { passkeysFor, passwordSignInAllowed, relyingParty, siteRpID } from "@/lib/passkeys";
import PasskeyList, { type PasskeyRow } from "./PasskeyList";
import SignOutOthers from "./SignOutOthers";

export const dynamic = "force-dynamic";

function fmtDate(ms: number): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: SITE_CONFIG.timeZone,
  }).format(ms);
}

function fmtWhen(iso: string | undefined): string {
  if (!iso) return "never used";
  const ms = Date.parse(iso);
  const days = Math.floor((Date.now() - ms) / 86_400_000);
  if (days < 1) return "used today";
  if (days === 1) return "used yesterday";
  if (days < 30) return `used ${days} days ago`;
  return `last used ${fmtDate(ms)}`;
}

export default async function AdminSecurityPage() {
  const [session, { passkeys, degraded }, head] = await Promise.all([
    getSession(),
    getAuthState(),
    headers(),
  ]);
  const rp = relyingParty(head.get("host"));
  const site = siteRpID();
  // The ones that can sign in here. Local development shares the store with
  // production, so this is also what keeps localhost's apart from the site's.
  const here = passkeysFor(passkeys, rp?.rpID ?? site);
  const siteCount = passkeysFor(passkeys, site).length;
  const passwordOn = passwordSignInAllowed(siteCount, degraded);
  const dev = process.env.NODE_ENV === "development";
  const emergency = process.env.ADMIN_PASSWORD_LOGIN === "on";

  const rows: PasskeyRow[] = [...here]
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .map((p) => ({
      id: p.id,
      title: p.provider ?? (p.device ? `${p.device} passkey` : "Passkey"),
      detail: [`Added ${fmtDate(Date.parse(p.createdAt))}${p.device ? ` on ${p.device}` : ""}`, fmtWhen(p.lastUsedAt)].join(" · "),
      synced: !!p.backedUp,
    }));

  let passwordStatus: { label: string; hint: string };
  if (dev) {
    passwordStatus = { label: "On", hint: "Always on in local development." };
  } else if (emergency) {
    passwordStatus = {
      label: "On — emergency switch",
      hint: "ADMIN_PASSWORD_LOGIN is set to on. Remove it in Vercel and redeploy once you're back in with a passkey.",
    };
  } else if (passwordOn) {
    passwordStatus = {
      label: "On until you add a passkey",
      hint: "Add a passkey and the password stops working here.",
    };
  } else {
    passwordStatus = {
      label: "Off",
      hint: "Lost every passkey? Set ADMIN_PASSWORD_LOGIN=on in Vercel and redeploy to use the password, then turn it off again.",
    };
  }

  return (
    <div>
      <h1 className="adm-page-title">Security</h1>
      <p className="adm-page-sub">How you sign in to this admin.</p>

      <section className="adm-section">
        <h2 className="adm-section-title">Passkeys</h2>
        <PasskeyList
          rows={rows}
          canAdd={!!rp}
          cantAddReason={`Passkeys for the live site can only be added on ${site}.`}
          lastWarning={!dev && rows.length === 1 ? "Password sign-in will turn back on." : null}
        />
      </section>

      <div className="adm-grid">
        <section className="adm-section">
          <h2 className="adm-section-title">Sessions</h2>
          <div className="adm-card">
            {session && (
              <div className="adm-row">
                <div className="adm-row-text">
                  <span className="adm-row-label">This browser</span>
                  <span className="adm-row-hint">
                    Signed in {fmtDate(session.issuedAt)} · expires{" "}
                    {fmtDate(session.issuedAt + SESSION_MAX_AGE_MS)}
                  </span>
                </div>
              </div>
            )}
            <SignOutOthers />
          </div>
        </section>

        <section className="adm-section">
          <h2 className="adm-section-title">Password</h2>
          <div className="adm-card">
            <div className="adm-row">
              <div className="adm-row-text">
                <span className="adm-row-label">{passwordStatus.label}</span>
                <span className="adm-row-hint">{passwordStatus.hint}</span>
              </div>
            </div>
            {!process.env.ADMIN_SECRET && (
              <div className="adm-row">
                <div className="adm-row-text">
                  <span className="adm-row-label" style={{ color: "var(--adm-red)" }}>
                    No separate signing secret
                  </span>
                  <span className="adm-row-hint">
                    Sessions are signed with ADMIN_PASSWORD. Set ADMIN_SECRET to a long random value in
                    Vercel so a session cookie says nothing about the password. Everyone gets signed out
                    once when it changes.
                  </span>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
