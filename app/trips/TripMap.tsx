"use client";

import { useEffect, useMemo, useState } from "react";

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
  fetchedAt: string;
  tracks: MapTrack[];
  points: MapPoint[];
  latestPoint?: MapPoint;
  totalPoints: number;
  error?: string;
};

type Bounds = {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
};

const EMPTY_RESPONSE: MapShareResponse = {
  configured: false,
  fetchedAt: "",
  tracks: [],
  points: [],
  totalPoints: 0,
};

function formatDate(value?: string) {
  if (!value) return "Unknown";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatCoordinate(point?: MapPoint) {
  if (!point) return "Waiting for signal";
  return `${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}`;
}

function getBounds(points: MapPoint[]): Bounds | undefined {
  if (!points.length) return undefined;

  return points.reduce<Bounds>(
    (bounds, point) => ({
      minLat: Math.min(bounds.minLat, point.lat),
      maxLat: Math.max(bounds.maxLat, point.lat),
      minLng: Math.min(bounds.minLng, point.lng),
      maxLng: Math.max(bounds.maxLng, point.lng),
    }),
    {
      minLat: points[0].lat,
      maxLat: points[0].lat,
      minLng: points[0].lng,
      maxLng: points[0].lng,
    },
  );
}

function project(point: MapPoint, bounds: Bounds, width: number, height: number) {
  const padding = 42;
  const latSpan = Math.max(bounds.maxLat - bounds.minLat, 0.001);
  const lngSpan = Math.max(bounds.maxLng - bounds.minLng, 0.001);
  const usableWidth = width - padding * 2;
  const usableHeight = height - padding * 2;

  return {
    x: padding + ((point.lng - bounds.minLng) / lngSpan) * usableWidth,
    y: padding + ((bounds.maxLat - point.lat) / latSpan) * usableHeight,
  };
}

function pathForTrack(track: MapTrack, bounds: Bounds, width: number, height: number) {
  return track.coordinates
    .map((point, index) => {
      const { x, y } = project(point, bounds, width, height);
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

export default function TripMap() {
  const [data, setData] = useState<MapShareResponse>(EMPTY_RESPONSE);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let ignore = false;

    async function loadMapShare() {
      try {
        const response = await fetch("/api/mapshare", { cache: "no-store" });
        const payload = (await response.json()) as MapShareResponse;

        if (!ignore) {
          setData(payload);
          setStatus(response.ok ? "ready" : "error");
        }
      } catch {
        if (!ignore) {
          setStatus("error");
        }
      }
    }

    loadMapShare();
    const interval = window.setInterval(loadMapShare, 5 * 60 * 1000);

    return () => {
      ignore = true;
      window.clearInterval(interval);
    };
  }, []);

  const allPoints = useMemo(
    () => [...data.tracks.flatMap((track) => track.coordinates), ...data.points],
    [data.points, data.tracks],
  );
  const bounds = useMemo(() => getBounds(allPoints), [allPoints]);
  const recentPoints = data.points.slice(0, 8);
  const width = 960;
  const height = 560;
  const latestProjected = data.latestPoint && bounds ? project(data.latestPoint, bounds, width, height) : undefined;

  return (
    <section className="mt-10 grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div
        className="relative overflow-hidden border"
        style={{
          borderColor: "var(--color-rule)",
          background: "var(--color-bg-paper)",
          minHeight: 360,
        }}
      >
        <svg
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label="Backpacking trip tracker map"
          className="block h-full min-h-[360px] w-full"
          preserveAspectRatio="xMidYMid meet"
        >
          <rect width={width} height={height} fill="var(--color-bg-paper)" />
          <g opacity="0.7" stroke="var(--color-border-faint)" strokeWidth="1">
            {Array.from({ length: 12 }).map((_, index) => (
              <line key={`v-${index}`} x1={index * 88} x2={index * 88} y1="0" y2={height} />
            ))}
            {Array.from({ length: 8 }).map((_, index) => (
              <line key={`h-${index}`} x1="0" x2={width} y1={index * 80} y2={index * 80} />
            ))}
          </g>

          {bounds ? (
            <>
              {data.tracks.map((track) => (
                <path
                  key={track.id}
                  d={pathForTrack(track, bounds, width, height)}
                  fill="none"
                  stroke="var(--accent)"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="5"
                />
              ))}
              {data.points.map((point, index) => {
                const projected = project(point, bounds, width, height);
                return (
                  <circle
                    key={`${point.lat}-${point.lng}-${point.time ?? index}`}
                    cx={projected.x}
                    cy={projected.y}
                    r="5"
                    fill={index === 0 ? "var(--accent)" : "var(--color-text)"}
                    opacity={index === 0 ? "1" : "0.55"}
                  />
                );
              })}
              {latestProjected && (
                <g>
                  <circle cx={latestProjected.x} cy={latestProjected.y} r="15" fill="var(--accent)" opacity="0.18" />
                  <circle cx={latestProjected.x} cy={latestProjected.y} r="6" fill="var(--accent)" />
                </g>
              )}
            </>
          ) : (
            <text
              x="50%"
              y="50%"
              dominantBaseline="middle"
              textAnchor="middle"
              fill="var(--color-text-variant)"
              fontSize="22"
              fontWeight="650"
            >
              {status === "loading" ? "Loading tracker" : "Tracker waiting for a MapShare feed"}
            </text>
          )}
        </svg>
      </div>

      <aside className="border-t pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0" style={{ borderColor: "var(--color-rule)" }}>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-1">
          <div>
            <div className="text-[12px] font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--color-text-faint)" }}>
              Latest
            </div>
            <div className="mt-1 text-[18px] font-semibold tracking-[-0.015em]" style={{ color: "var(--color-text)" }}>
              {formatDate(data.latestPoint?.time)}
            </div>
          </div>
          <div>
            <div className="text-[12px] font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--color-text-faint)" }}>
              Position
            </div>
            <div className="mt-1 break-words text-[14px] font-medium leading-[1.45]" style={{ color: "var(--color-text-variant)" }}>
              {formatCoordinate(data.latestPoint)}
            </div>
          </div>
          <div>
            <div className="text-[12px] font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--color-text-faint)" }}>
              Signals
            </div>
            <div className="mt-1 text-[18px] font-semibold tracking-[-0.015em]" style={{ color: "var(--color-text)" }}>
              {data.totalPoints}
            </div>
          </div>
          <div>
            <div className="text-[12px] font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--color-text-faint)" }}>
              Status
            </div>
            <div className="mt-1 text-[14px] font-medium leading-[1.45]" style={{ color: "var(--color-text-variant)" }}>
              {status === "error" || data.error
                ? "Feed unavailable"
                : data.configured
                  ? "Live from MapShare"
                  : "Not configured"}
            </div>
          </div>
        </div>

        <div className="mt-8">
          <div className="text-[12px] font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--color-text-faint)" }}>
            Recent points
          </div>
          <div className="mt-3 flex flex-col">
            {recentPoints.length ? recentPoints.map((point) => (
              <div key={`${point.lat}-${point.lng}-${point.time ?? point.name}`} className="py-3" style={{ borderTop: "1px solid var(--color-border-faint)" }}>
                <div className="text-[14px] font-semibold" style={{ color: "var(--color-text)" }}>
                  {point.name ?? formatDate(point.time)}
                </div>
                <div className="mt-1 text-[13px]" style={{ color: "var(--color-text-faint)" }}>
                  {formatDate(point.time)}
                </div>
              </div>
            )) : (
              <div className="py-3 text-[14px]" style={{ color: "var(--color-text-variant)", borderTop: "1px solid var(--color-border-faint)" }}>
                No points yet.
              </div>
            )}
          </div>
        </div>
      </aside>
    </section>
  );
}
