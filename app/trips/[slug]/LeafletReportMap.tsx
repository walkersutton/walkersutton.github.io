"use client";

import L from "leaflet";
import { Fragment, useEffect, useMemo } from "react";
import { MapContainer, Marker, Polyline, TileLayer, Tooltip, useMap } from "react-leaflet";
import type { LatLngBoundsExpression, LatLngExpression } from "leaflet";

export type ReportWaypoint = {
  lat: number;
  lng: number;
  name: string;
  desc: string;
  elev: string;
};

export type ReportTrack = {
  id: string;
  coords: [number, number][];
  /** 1-based day this segment was ridden on, when the geojson dated it. */
  day?: number;
  label?: string;
};

type Props = {
  tracks: ReportTrack[];
  waypoints: ReportWaypoint[];
  start: { lat: number; lng: number; name: string };
  /** Day number → the `<DayMarker>` id to scroll to. See lib/trips.ts. */
  dayAnchors?: Record<number, string>;
};

/**
 * Take the reader to where this day is written up.
 *
 * `replaceState` rather than a `#` link: the position becomes shareable, but
 * clicking through a 26-day trip doesn't leave 26 entries for the back button
 * to walk out of. Smooth by default, instant for anyone who asked for less
 * motion — a page-length jump is exactly the kind they mean.
 */
function scrollToDay(anchor: string) {
  const target = document.getElementById(anchor);
  if (!target) return;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  target.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
  history.replaceState(null, "", `#${anchor}`);
}

function FitBounds({ tracks }: { tracks: ReportTrack[] }) {
  const map = useMap();
  const all: LatLngExpression[] = useMemo(
    () => tracks.flatMap((t) => t.coords as LatLngExpression[]),
    [tracks],
  );
  useEffect(() => {
    if (all.length > 1) {
      map.fitBounds(all as LatLngBoundsExpression, { padding: [40, 40], maxZoom: 12 });
    }
  }, [all, map]);
  return null;
}

function useStartIcon() {
  return useMemo(
    () =>
      L.divIcon({
        className: "",
        html: `<div style="width:12px;height:12px;border-radius:50%;background:#fff;border:3px solid var(--color-text);box-shadow:0 2px 8px rgba(0,0,0,0.2)"></div>`,
        iconSize: [12, 12] as L.PointExpression,
        iconAnchor: [6, 6] as L.PointExpression,
      }),
    [],
  );
}

function useWaypointIcon() {
  return useMemo(
    () =>
      L.divIcon({
        className: "",
        html: `<div style="width:10px;height:10px;border-radius:50%;background:var(--color-text);border:2.5px solid rgba(255,255,255,0.95);box-shadow:0 1px 4px rgba(0,0,0,0.22)"></div>`,
        iconSize: [10, 10] as L.PointExpression,
        iconAnchor: [5, 5] as L.PointExpression,
      }),
    [],
  );
}

function ZoomControl() {
  const map = useMap();
  useEffect(() => {
    const ctrl = L.control.zoom({ position: "topright" });
    ctrl.addTo(map);
    return () => { ctrl.remove(); };
  }, [map]);
  return null;
}

function WheelZoomFix() {
  const map = useMap();
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handler = (map as any).scrollWheelZoom;
    if (!handler) return;
    const orig = handler._onWheelScroll.bind(handler);
    handler._onWheelScroll = function(e: WheelEvent) {
      orig(e);
      const rect = map.getContainer().getBoundingClientRect();
      handler._lastMousePos = L.point(e.clientX - rect.left, e.clientY - rect.top);
    };
    return () => { handler._onWheelScroll = orig; };
  }, [map]);
  return null;
}

export default function LeafletReportMap({ tracks, waypoints, start, dayAnchors = {} }: Props) {
  const startIcon = useStartIcon();
  const wptIcon = useWaypointIcon();

  return (
    <MapContainer
      className="h-full w-full trips-leaflet"
      style={{ height: "100%", width: "100%" }}
      center={[47.58, -123.74]}
      zoom={10}
      scrollWheelZoom
      zoomControl={false}
      dragging
      touchZoom
    >
      <TileLayer
        attribution='© <a href="https://openstreetmap.org/copyright">OpenStreetMap</a> contributors, SRTM | © <a href="https://opentopomap.org">OpenTopoMap</a> (CC-BY-SA)'
        url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
        maxZoom={17}
        subdomains={["a", "b", "c"] as string[]}
      />
      <ZoomControl />
      <WheelZoomFix />
      <FitBounds tracks={tracks} />

      {tracks.map((track, i) => {
        const anchor = track.day != null ? dayAnchors[track.day] : undefined;
        // Both lines take the click. The 5px black one is what a reader aims
        // at, but it is nearly untappable on a phone; the 11px halo under it is
        // the hit area that makes this work with a thumb.
        const handlers = anchor ? { click: () => scrollToDay(anchor) } : undefined;
        return (
          <Fragment key={track.id}>
            <Polyline
              positions={track.coords as LatLngExpression[]}
              pathOptions={{ color: "rgba(255,255,255,0.88)", weight: 11, lineCap: "round" }}
              eventHandlers={handlers}
            />
            <Polyline
              positions={track.coords as LatLngExpression[]}
              pathOptions={{ color: "#000", weight: 5, lineCap: "round", opacity: i % 2 === 0 ? 1 : 0.8 }}
              eventHandlers={handlers}
            >
              {track.label && (
                <Tooltip sticky className="ws-tip">
                  <strong>{track.label}</strong>
                  {anchor && (
                    <>
                      <br />
                      <span style={{ color: "var(--color-text-faint)" }}>
                        Click to jump to this day
                      </span>
                    </>
                  )}
                </Tooltip>
              )}
            </Polyline>
          </Fragment>
        );
      })}

      <Marker position={[start.lat, start.lng]} icon={startIcon} zIndexOffset={800}>
        <Tooltip direction="top" offset={[0, -10]} className="ws-tip">
          <strong>{start.name}</strong>
          <br />
          <span style={{ color: "var(--color-text-faint)" }}>Start &amp; finish</span>
        </Tooltip>
      </Marker>

      {waypoints.map((wpt, i) => (
        <Marker
          key={wpt.name}
          position={[wpt.lat, wpt.lng]}
          icon={wptIcon}
          zIndexOffset={600 + i}
        >
          <Tooltip direction="top" offset={[0, -9]} className="ws-tip">
            <strong>{wpt.name}</strong>
            {" "}
            <span style={{ color: "var(--color-text-faint)" }}>{wpt.elev}</span>
            <br />
            <span style={{ color: "var(--color-text-variant)" }}>{wpt.desc}</span>
          </Tooltip>
        </Marker>
      ))}
    </MapContainer>
  );
}
