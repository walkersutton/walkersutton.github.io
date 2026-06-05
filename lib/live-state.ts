import fs from "fs";
import path from "path";

const STATE_FILE = path.join(process.cwd(), "data", "live-state.json");
const DEFAULT_BANNER_TEXT = "Walker is currently on trail";

type LiveState = { enabled: boolean; bannerText?: string; latestText?: string; latestHref?: string; activeTripName?: string };

function edgeConfigId(): string | null {
  const url = process.env.EDGE_CONFIG;
  if (!url) return null;
  const match = url.match(/\/([^/?]+)\?/);
  return match?.[1] ?? null;
}

function readLocalState(): LiveState {
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, "utf-8")) as LiveState;
  } catch {
    return { enabled: false };
  }
}

function writeLocalState(patch: Partial<LiveState>) {
  const current = readLocalState();
  fs.writeFileSync(STATE_FILE, JSON.stringify({ ...current, ...patch }, null, 2));
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

  return readLocalState().enabled ?? !!process.env.GARMIN_MAPSHARE_KML_URL;
}

export async function getBannerText(): Promise<string> {
  if (process.env.EDGE_CONFIG) {
    try {
      const { get } = await import("@vercel/edge-config");
      const value = await get<string>("liveBannerText");
      if (typeof value === "string" && value) return value;
    } catch {
      // fall through to local fallback
    }
  }

  return readLocalState().bannerText ?? DEFAULT_BANNER_TEXT;
}

async function edgePatch(items: { operation: string; key: string; value: unknown }[]) {
  const id = edgeConfigId();
  if (!id || !process.env.VERCEL_API_TOKEN) return false;
  const teamParam = process.env.VERCEL_TEAM_ID ? `?teamId=${process.env.VERCEL_TEAM_ID}` : "";
  const res = await fetch(`https://api.vercel.com/v1/edge-config/${id}/items${teamParam}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${process.env.VERCEL_API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ items }),
  });
  if (!res.ok) throw new Error(`Edge Config write failed: ${res.status}`);
  return true;
}

export async function setLiveEnabled(enabled: boolean): Promise<void> {
  if (await edgePatch([{ operation: "upsert", key: "live", value: enabled }])) return;
  writeLocalState({ enabled });
}

export async function setBannerText(text: string): Promise<void> {
  if (await edgePatch([{ operation: "upsert", key: "liveBannerText", value: text }])) return;
  writeLocalState({ bannerText: text });
}

export async function getLatestOverride(): Promise<{ text: string; href: string } | null> {
  let text: string | undefined;
  let href: string | undefined;

  if (process.env.EDGE_CONFIG) {
    try {
      const { get } = await import("@vercel/edge-config");
      text = (await get<string>("latestText")) ?? undefined;
      href = (await get<string>("latestHref")) ?? undefined;
    } catch {
      // fall through to local fallback
    }
  }

  if (!text || !href) {
    const s = readLocalState();
    text = text ?? s.latestText;
    href = href ?? s.latestHref;
  }

  if (text && href) return { text, href };
  return null;
}

export async function getActiveTripName(): Promise<string> {
  if (process.env.EDGE_CONFIG) {
    try {
      const { get } = await import("@vercel/edge-config");
      const value = await get<string>("activeTripName");
      if (typeof value === "string" && value) return value;
    } catch {
      // fall through to local fallback
    }
  }

  return readLocalState().activeTripName ?? "Active Trip";
}

export async function setActiveTripName(name: string): Promise<void> {
  if (await edgePatch([{ operation: "upsert", key: "activeTripName", value: name }])) return;
  writeLocalState({ activeTripName: name });
}

export async function setLatestOverride(text: string, href: string): Promise<void> {
  if (await edgePatch([
    { operation: "upsert", key: "latestText", value: text },
    { operation: "upsert", key: "latestHref", value: href },
  ])) return;
  writeLocalState({ latestText: text, latestHref: href });
}
