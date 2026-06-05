import { cookies } from "next/headers";
import { verifyToken } from "@/lib/admin-auth";
import { getLiveEnabled, getBannerEnabled, getBannerText, getBannerLink, getLatestOverride, getActiveTripName } from "@/lib/live-state";
import { logout, setLive, setBanner, saveBannerText, saveBannerLink, saveLatestOverride, saveActiveTripName } from "./actions";
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
  const isBannerEnabled = await getBannerEnabled();
  const bannerText = await getBannerText();
  const bannerLink = await getBannerLink();
  const latestOverride = await getLatestOverride();
  const activeTripName = await getActiveTripName();

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
        <span style={LABEL}>On trip</span>
        <form action={setLive.bind(null, true)}>
          <button type="submit" style={BTN(isLive)}>On</button>
        </form>
        <form action={setLive.bind(null, false)}>
          <button type="submit" style={BTN(!isLive)}>Off</button>
        </form>
      </div>

      <form action={saveActiveTripName} style={ROW}>
        <span style={LABEL}>Active trip</span>
        <input
          name="activeTripName"
          defaultValue={activeTripName}
          style={{
            flex: 1,
            fontSize: 12,
            fontFamily: "inherit",
            padding: "6px 10px",
            border: "1.5px solid var(--color-text)",
            background: "transparent",
            color: "var(--color-text)",
          }}
        />
        <button type="submit" style={BTN(false)}>Save</button>
      </form>

      <div style={ROW}>
        <span style={LABEL}>Banner</span>
        <form action={setBanner.bind(null, true)}>
          <button type="submit" style={BTN(isBannerEnabled)}>On</button>
        </form>
        <form action={setBanner.bind(null, false)}>
          <button type="submit" style={BTN(!isBannerEnabled)}>Off</button>
        </form>
      </div>

      <form action={saveBannerText} style={ROW}>
        <span style={LABEL}>Banner text</span>
        <input
          name="bannerText"
          defaultValue={bannerText}
          style={{
            flex: 1,
            fontSize: 12,
            fontFamily: "inherit",
            padding: "6px 10px",
            border: "1.5px solid var(--color-text)",
            background: "transparent",
            color: "var(--color-text)",
          }}
        />
        <button type="submit" style={BTN(false)}>Save</button>
      </form>

      <form action={saveBannerLink} style={ROW}>
        <span style={LABEL}>Banner link</span>
        <input
          name="bannerLink"
          defaultValue={bannerLink}
          style={{
            flex: 1,
            fontSize: 12,
            fontFamily: "inherit",
            padding: "6px 10px",
            border: "1.5px solid var(--color-text)",
            background: "transparent",
            color: "var(--color-text)",
          }}
        />
        <button type="submit" style={BTN(false)}>Save</button>
      </form>

      <form action={saveLatestOverride} style={{ padding: "14px 0", borderBottom: "1px solid var(--color-border-faint)", display: "flex", flexDirection: "column", gap: 10 }}>
        <span style={LABEL}>Latest</span>
        <input
          name="latestText"
          placeholder="Text (leave blank to auto)"
          defaultValue={latestOverride?.text ?? ""}
          style={{
            fontSize: 12,
            fontFamily: "inherit",
            padding: "6px 10px",
            border: "1.5px solid var(--color-text)",
            background: "transparent",
            color: "var(--color-text)",
          }}
        />
        <div style={{ display: "flex", gap: 10 }}>
          <input
            name="latestHref"
            placeholder="Link URL (leave blank to auto)"
            defaultValue={latestOverride?.href ?? ""}
            style={{
              flex: 1,
              fontSize: 12,
              fontFamily: "inherit",
              padding: "6px 10px",
              border: "1.5px solid var(--color-text)",
              background: "transparent",
              color: "var(--color-text)",
            }}
          />
          <button type="submit" style={BTN(false)}>Save</button>
        </div>
      </form>

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
