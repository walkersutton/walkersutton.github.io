import { headers } from "next/headers";
import { getSession } from "@/lib/admin-auth";
import { getAuthState } from "@/lib/live-state";
import { passkeysFor, passwordSignInAllowed, relyingParty, siteRpID } from "@/lib/passkeys";
import LoginForm from "./LoginForm";
import AdminSidebar from "./AdminSidebar";
import "./admin.css";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession().catch(() => null);

  if (!session) {
    const [{ passkeys, degraded }, head] = await Promise.all([getAuthState(), headers()]);
    const rp = relyingParty(head.get("host"));
    return (
      <div className="adm adm-login">
        <LoginForm
          passkey={!!rp && passkeysFor(passkeys, rp.rpID).length > 0}
          password={passwordSignInAllowed(passkeysFor(passkeys, siteRpID()).length, degraded)}
          siteHost={siteRpID()}
        />
      </div>
    );
  }

  return (
    <div className="adm adm-shell">
      <AdminSidebar />
      <main className="adm-main">{children}</main>
    </div>
  );
}
