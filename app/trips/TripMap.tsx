"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { TRIPS } from "./TripsIndex";

type MapPoint = {
  lat: number;
  lng: number;
  elevation?: number;
  time?: string;
  name?: string;
  description?: string;
};

type MapTrack = {
  id: string;
  name: string;
  coordinates: MapPoint[];
};

type MapShareResponse = {
  configured: boolean;
  sample?: boolean;
  fetchedAt: string;
  tracks: MapTrack[];
  points: MapPoint[];
  latestPoint?: MapPoint;
  totalPoints: number;
  error?: string;
};

type Layout = "a" | "b";

const EMPTY: MapShareResponse = {
  configured: false,
  fetchedAt: "",
  tracks: [],
  points: [],
  totalPoints: 0,
};

const NAV = [
  { href: "/projects", label: "Projects" },
  { href: "/blog", label: "Blog" },
  { href: "/trips", label: "Trips" },
  { href: "/services", label: "Services" },
  { href: "/goods", label: "Goods" },
];

const LeafletTripMap = dynamic(() => import("./LeafletTripMap"), {
  ssr: false,
  loading: () => (
    <div
      className="flex h-full w-full items-center justify-center text-[13px]"
      style={{ background: "var(--color-bg-sink)", color: "var(--color-text-faint)" }}
    >
      Loading map
    </div>
  ),
});

// ── Stats ─────────────────────────────────────────────────────────
function haversineM(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371000, r = Math.PI / 180;
  const f1 = a.lat * r, f2 = b.lat * r;
  const df = (b.lat - a.lat) * r, dl = (b.lng - a.lng) * r;
  const x = Math.sin(df / 2) ** 2 + Math.cos(f1) * Math.cos(f2) * Math.sin(dl / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

function computeStats(data: MapShareResponse) {
  let distM = 0, gainM = 0, lossM = 0;
  let tMin: number | null = null, tMax: number | null = null;
  data.tracks.forEach((track) => {
    track.coordinates.forEach((p, i) => {
      if (i > 0) {
        const prev = track.coordinates[i - 1];
        distM += haversineM(prev, p);
        if (prev.elevation != null && p.elevation != null) {
          const d = p.elevation - prev.elevation;
          if (d > 0) gainM += d; else lossM -= d;
        }
      }
      if (p.time) { const ms = Date.parse(p.time); if (!isNaN(ms)) { if (tMin === null || ms < tMin) tMin = ms; if (tMax === null || ms > tMax) tMax = ms; } }
    });
  });
  data.points.forEach((p) => {
    if (p.time) { const ms = Date.parse(p.time); if (!isNaN(ms)) { if (tMin === null || ms < tMin) tMin = ms; if (tMax === null || ms > tMax) tMax = ms; } }
  });
  return {
    distMi: distM / 1609.344,
    gainFt: gainM * 3.28084,
    lossFt: lossM * 3.28084,
    elapsedMs: tMin !== null && tMax !== null ? tMax - tMin : null,
  };
}

function fmtMi(mi: number) { return mi > 0 ? mi.toFixed(1) + " mi" : "—"; }
function fmtFt(ft: number) { return ft > 0 ? Math.round(ft).toLocaleString() + " ft" : "—"; }
function fmtElevFt(elev?: number) { return elev != null ? Math.round(elev * 3.28084).toLocaleString() + " ft" : "—"; }
function fmtCoord(p?: MapPoint) {
  if (!p) return "—";
  return `${Math.abs(p.lat).toFixed(5)}°${p.lat >= 0 ? "N" : "S"},  ${Math.abs(p.lng).toFixed(5)}°${p.lng >= 0 ? "E" : "W"}`;
}
function fmtElapsed(ms: number | null) {
  if (!ms || ms <= 0) return "—";
  const m = Math.round(ms / 60000);
  const d = Math.floor(m / 1440), h = Math.floor((m % 1440) / 60), mn = m % 60;
  if (d > 0) return `${d}d ${h}h ${mn}m`;
  if (h > 0) return `${h}h ${mn}m`;
  return `${mn}m`;
}
function fmtUpdated(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return "Updated " + new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(d);
}

// ── Sub-components ────────────────────────────────────────────────
function Lbl({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="text-[10.5px] font-semibold uppercase tracking-[0.13em] mb-1"
      style={{ color: "var(--color-text-faint)" }}
    >
      {children}
    </div>
  );
}

function Val({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="text-[19px] font-semibold tracking-[-0.022em] leading-[1.1]"
      style={{ color: "var(--color-text)" }}
    >
      {children}
    </div>
  );
}

function LayoutToggle({ layout, onToggle }: { layout: Layout; onToggle: (l: Layout) => void }) {
  return (
    <div
      className="flex shrink-0 overflow-hidden rounded-[6px]"
      style={{ border: "1px solid var(--color-border)" }}
    >
      {(["a", "b"] as Layout[]).map((l) => (
        <button
          key={l}
          onClick={() => onToggle(l)}
          className="px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.04em] cursor-pointer transition-colors duration-150"
          style={{
            border: "none",
            background: layout === l ? "var(--color-text)" : "transparent",
            color: layout === l ? "var(--color-bg)" : "var(--color-text-faint)",
          }}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

function StatsPanel({
  data,
  stats,
  layout,
  onToggle,
}: {
  data: MapShareResponse;
  stats: ReturnType<typeof computeStats>;
  layout: Layout;
  onToggle: (l: Layout) => void;
}) {
  const tripName = data.tracks[0]?.name ?? (data.sample ? "Sample Track" : "Active Trip");
  const updatedText = fmtUpdated(data.latestPoint?.time);
  const latestDesc = data.latestPoint?.description ?? data.points[0]?.description;

  const sectionCls = "border-b";
  const sectionStyle = { borderColor: "var(--color-border-faint)", padding: "16px 18px" };

  return (
    <>
      {/* Identity + toggle */}
      <div
        className="flex items-start justify-between gap-[10px]"
        style={{ ...sectionStyle, borderBottom: "1px solid var(--color-border-faint)" }}
      >
        <div>
          <div className="inline-flex items-center gap-[6px] text-[10.5px] font-semibold uppercase tracking-[0.13em] mb-[6px]" style={{ color: "var(--accent-green)" }}>
            <span className="trips-live-dot" />
            Live
          </div>
          <div className="text-[20px] font-semibold tracking-[-0.02em] leading-[1.1] mb-[3px]" style={{ color: "var(--color-text)" }}>
            {tripName}
          </div>
          {updatedText && (
            <div className="text-[12px] mt-[2px]" style={{ color: "var(--color-text-faint)" }}>
              {updatedText}
            </div>
          )}
        </div>
        <div style={{ marginTop: 2 }}>
          <LayoutToggle layout={layout} onToggle={onToggle} />
        </div>
      </div>

      {/* Stats */}
      <div style={sectionStyle}>
        <div className="grid gap-x-[10px] gap-y-[14px]" style={{ gridTemplateColumns: "1fr 1fr" }}>
          <div><Lbl>Distance</Lbl><Val>{fmtMi(stats.distMi)}</Val></div>
          <div><Lbl>Elevation</Lbl><Val>{fmtElevFt(data.latestPoint?.elevation)}</Val></div>
          <div><Lbl>Gained</Lbl><Val>{fmtFt(stats.gainFt)}</Val></div>
          <div><Lbl>Lost</Lbl><Val>{fmtFt(stats.lossFt)}</Val></div>
          <div style={{ gridColumn: "1 / -1" }}><Lbl>Elapsed</Lbl><Val>{fmtElapsed(stats.elapsedMs)}</Val></div>
          <div style={{ gridColumn: "1 / -1" }}>
            <Lbl>Coordinates</Lbl>
            <div className="text-[12.5px] font-medium leading-[1.55]" style={{ color: "var(--color-text-variant)" }}>
              {fmtCoord(data.latestPoint)}
            </div>
          </div>
        </div>
      </div>

      {/* Latest check-in */}
      {(latestDesc || data.totalPoints === 0) && (
        <div style={sectionStyle}>
          <Lbl>Latest check-in</Lbl>
          <div
            className="text-[13px] leading-[1.55] mt-[7px]"
            style={{
              padding: "9px 12px",
              background: "var(--color-bg-sink)",
              borderLeft: "2.5px solid var(--color-text)",
              color: "var(--color-text-variant)",
            }}
          >
            {latestDesc ?? "No messages yet."}
          </div>
        </div>
      )}

      {/* Past trips */}
      <div style={{ ...sectionStyle, borderBottom: "none" }}>
        <Lbl>Past trips</Lbl>
        <div className="mt-[10px] flex flex-col">
          {TRIPS.map((trip, i) => (
            <Link
              key={trip.name}
              href={trip.href}
              className="flex items-start justify-between gap-[10px] py-[9px] no-underline trips-past-row"
              style={{
                borderBottom: i < TRIPS.length - 1 ? "1px solid var(--color-border-faint)" : "none",
                color: "inherit",
              }}
            >
              <div className="trips-past-inner">
                <div className="text-[13px] font-semibold tracking-[-0.01em]" style={{ color: "var(--color-text)" }}>
                  {trip.name}
                </div>
                <div className="text-[11.5px] mt-[2px]" style={{ color: "var(--color-text-faint)" }}>
                  {trip.stats} · {trip.days}
                </div>
              </div>
              <div
                className="text-[11.5px] shrink-0 whitespace-nowrap trips-past-date"
                style={{ color: "var(--color-text-faint)", paddingTop: 1 }}
              >
                {trip.date}&nbsp;→
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}

// ── Glass header ──────────────────────────────────────────────────
function GlassHeader() {
  return (
    <div
      className="absolute left-0 right-0 top-0 z-10"
      style={{
        height: 71,
        background: "rgba(var(--header-glass-rgb), 0.86)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
      }}
    >
      <div
        className="flex items-center gap-6 mx-auto"
        style={{ maxWidth: 1080, padding: "0 24px", height: 70 }}
      >
        <Link
          href="/"
          className="flex items-center gap-3 no-underline shrink-0"
          style={{ color: "var(--color-text)" }}
        >
          <span
            className="rounded-full shrink-0"
            style={{ width: 11, height: 11, background: "var(--accent)" }}
          />
          <span className="text-[21px] font-[680] tracking-[-0.02em]">Walker Sutton</span>
        </Link>
        <nav className="ml-auto hidden sm:flex gap-7">
          {NAV.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              data-active={href === "/trips" ? "true" : undefined}
              className="link-sweep py-1.5 text-[15px] font-medium no-underline transition-colors duration-150"
              style={{ color: href === "/trips" ? "var(--color-text)" : "var(--color-text-variant)" }}
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
      <div style={{ height: 1, background: "var(--color-border-faint)" }} />
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────
export default function TripMap() {
  const [data, setData] = useState<MapShareResponse>(EMPTY);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [layout, setLayout] = useState<Layout>("a");

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const params = new URLSearchParams(window.location.search);
        const q = params.get("sample") === "1" ? "?sample=1" : "";
        const res = await fetch(`/api/mapshare${q}`, { cache: "no-store" });
        const payload = (await res.json()) as MapShareResponse;
        if (!ignore) { setData(payload); setStatus(res.ok ? "ready" : "error"); }
      } catch { if (!ignore) setStatus("error"); }
    }
    load();
    const iv = window.setInterval(load, 5 * 60 * 1000);
    return () => { ignore = true; clearInterval(iv); };
  }, []);

  const stats = useMemo(() => computeStats(data), [data]);

  const overlayGlass: React.CSSProperties = {
    background: "rgba(var(--header-glass-rgb), 0.86)",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
    border: "1px solid var(--color-border-faint)",
    boxShadow: "0 8px 32px rgba(0,0,0,0.09)",
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, background: "var(--color-bg-sink)" }}>
      <GlassHeader />

      {layout === "a" ? (
        /* ── Layout A: full-bleed map + overlay card ── */
        <>
          <div style={{ position: "absolute", inset: 0 }}>
            <LeafletTripMap
              key="map-a"
              tracks={data.tracks}
              points={data.points}
              latestPoint={data.latestPoint}
              zoomPosition="topright"
            />
          </div>

          <div
            className="absolute overflow-y-auto"
            style={{
              ...overlayGlass,
              top: 71 + 14,
              left: 20,
              width: 272,
              maxHeight: "calc(100vh - 71px - 28px)",
              scrollbarWidth: "none",
              zIndex: 10,
            }}
          >
            <StatsPanel data={data} stats={stats} layout={layout} onToggle={setLayout} />
          </div>
        </>
      ) : (
        /* ── Layout B: sidebar + map ── */
        <div
          className="absolute left-0 right-0 bottom-0"
          style={{ top: 71, display: "grid", gridTemplateColumns: "308px 1fr" }}
        >
          <aside
            className="overflow-y-auto"
            style={{
              borderRight: "1px solid var(--color-rule)",
              scrollbarWidth: "thin",
              scrollbarColor: "var(--color-border) transparent",
            }}
          >
            <div style={{ padding: "0" }}>
              <StatsPanel data={data} stats={stats} layout={layout} onToggle={setLayout} />
            </div>
          </aside>

          <div style={{ height: "100%" }}>
            <LeafletTripMap
              key="map-b"
              tracks={data.tracks}
              points={data.points}
              latestPoint={data.latestPoint}
              zoomPosition="bottomright"
            />
          </div>
        </div>
      )}
    </div>
  );
}
