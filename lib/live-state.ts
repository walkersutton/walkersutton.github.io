import fs from "fs";
import path from "path";

const STATE_FILE = path.join(process.cwd(), "data", "live-state.json");

function edgeConfigId(): string | null {
  const url = process.env.EDGE_CONFIG;
  if (!url) return null;
  const match = url.match(/\/([^/?]+)\?/);
  return match?.[1] ?? null;
}

export async function getLiveEnabled(): Promise<boolean> {
  if (process.env.EDGE_CONFIG) {
    try {
      const { get } = await import("@vercel/edge-config");
      const value = await get<boolean>("live");
      if (typeof value === "boolean") return value;
    } catch {
      // fall through to local fallback
    }
  }

  try {
    const raw = fs.readFileSync(STATE_FILE, "utf-8");
    const data = JSON.parse(raw) as { enabled: boolean };
    return data.enabled;
  } catch {
    return !!process.env.GARMIN_MAPSHARE_KML_URL;
  }
}

export async function setLiveEnabled(enabled: boolean): Promise<void> {
  const id = edgeConfigId();
  if (id && process.env.VERCEL_API_TOKEN) {
    const teamParam = process.env.VERCEL_TEAM_ID
      ? `?teamId=${process.env.VERCEL_TEAM_ID}`
      : "";
    const res = await fetch(
      `https://api.vercel.com/v1/edge-config/${id}/items${teamParam}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${process.env.VERCEL_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: [{ operation: "upsert", key: "live", value: enabled }],
        }),
      }
    );
    if (!res.ok) throw new Error(`Edge Config write failed: ${res.status}`);
    return;
  }

  // Local dev: write to file
  fs.writeFileSync(STATE_FILE, JSON.stringify({ enabled }, null, 2));
}
