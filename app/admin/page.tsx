import { cookies } from "next/headers";
import { verifyToken } from "@/lib/admin-auth";
import { getLiveEnabled } from "@/lib/live-state";
import { logout, setLive } from "./actions";
import LoginForm from "./LoginForm";

export const dynamic = "force-dynamic";

async function isAuthenticated(): Promise<boolean> {
  const store = await cookies();
  const token = store.get("admin_session")?.value;
  if (!token) return false;
  try {
    return verifyToken(token);
  } catch {
    return false;
  }
}

const ROW: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 16,
  padding: "14px 0",
  borderBottom: "1px solid var(--color-border-faint)",
};

const LABEL: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  color: "var(--color-text-faint)",
  minWidth: 120,
};

const BTN = (active: boolean): React.CSSProperties => ({
  background: active ? "var(--color-text)" : "transparent",
  color: active ? "var(--color-bg)" : "var(--color-text)",
  border: "1.5px solid var(--color-text)",
  padding: "6px 14px",
  fontSize: 12,
  fontWeight: 600,
  fontFamily: "inherit",
  cursor: "pointer",
  letterSpacing: "0.05em",
  textTransform: "uppercase",
});

export default async function AdminPage() {
  const authed = await isAuthenticated();

  if (!authed) {
    return (
      <div style={{ maxWidth: 480, padding: "64px 0" }}>
        <p
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "var(--color-text-faint)",
            marginBottom: 24,
          }}
        >
          Admin
        </p>
        <LoginForm />
      </div>
    );
  }

  const isLive = await getLiveEnabled();

  return (
    <div style={{ maxWidth: 480, padding: "64px 0" }}>
      <p
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "var(--color-text-faint)",
          marginBottom: 32,
        }}
      >
        Admin
      </p>

      <div style={ROW}>
        <span style={LABEL}>Live banner</span>
        <form action={setLive.bind(null, true)}>
          <button type="submit" style={BTN(isLive)}>On</button>
        </form>
        <form action={setLive.bind(null, false)}>
          <button type="submit" style={BTN(!isLive)}>Off</button>
        </form>
      </div>

      <div style={{ marginTop: 48 }}>
        <form action={logout}>
          <button
            type="submit"
            style={{
              background: "none",
              border: "none",
              padding: 0,
              fontSize: 12,
              color: "var(--color-text-faint)",
              cursor: "pointer",
              fontFamily: "inherit",
              textDecoration: "underline",
              textUnderlineOffset: 3,
            }}
          >
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}
