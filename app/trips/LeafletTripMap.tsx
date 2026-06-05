"use client";

import L from "leaflet";
import { Fragment, useEffect, useMemo } from "react";
import { CircleMarker, MapContainer, Marker, Polyline, TileLayer, Tooltip, useMap } from "react-leaflet";
import type { LatLngBoundsExpression, LatLngExpression } from "leaflet";
import type { MapPoint, MapTrack } from "./mapshare";

type LeafletTripMapProps = {
  tracks: MapTrack[];
  points: MapPoint[];
  latestPoint?: MapPoint;
  zoomPosition?: "topright" | "topleft" | "bottomright" | "bottomleft";
  interactive?: boolean;
  showZoom?: boolean;
};

const DEFAULT_CENTER: LatLngExpression = [47.594, -123.84];

function toLL(p: MapPoint): LatLngExpression { return [p.lat, p.lng]; }

function FitBounds({ tracks, points, latestPoint }: Omit<LeafletTripMapProps, "zoomPosition">) {
  const map = useMap();
  const all = useMemo(() => [
    ...tracks.flatMap((t) => t.coordinates.map(toLL)),
    ...points.map(toLL),
    ...(latestPoint ? [toLL(latestPoint)] : []),
  ], [latestPoint, points, tracks]);

  useEffect(() => {
    if (all.length > 1) {
      map.fitBounds(all as LatLngBoundsExpression, { padding: [44, 44], maxZoom: 13 });
    } else if (all.length === 1) {
      map.setView(all[0], 13);
    }
  }, [all, map]);

  return null;
}

function ZoomControl({ position }: { position: NonNullable<LeafletTripMapProps["zoomPosition"]> }) {
  const map = useMap();
  useEffect(() => {
    const ctrl = L.control.zoom({ position });
    ctrl.addTo(map);
    return () => { ctrl.remove(); };
  }, [map, position]);
  return null;
}

function usePulseIcon() {
  return useMemo(() => L.divIcon({
    className: "",
    html: `<div style="position:relative;width:16px;height:16px">
      <div class="trips-pulse-ring" style="position:absolute;top:-6px;left:-6px;right:-6px;bottom:-6px"></div>
      <div class="trips-pulse-ring2" style="position:absolute;top:-2px;left:-2px;right:-2px;bottom:-2px"></div>
      <div class="trips-pulse-core" style="position:absolute;top:2px;left:2px;right:2px;bottom:2px"></div>
    </div>`,
    iconSize: [16, 16] as L.PointExpression,
    iconAnchor: [8, 8] as L.PointExpression,
  }), []);
}

export default function LeafletTripMap({
  tracks,
  points,
  latestPoint,
  zoomPosition = "topright",
  interactive = true,
  showZoom = true,
}: LeafletTripMapProps) {
  const pulseIcon = usePulseIcon();
  const waypoints = useMemo(() => {
    if (!latestPoint) return points;
    return points.filter((p) => !(p.lat === latestPoint.lat && p.lng === latestPoint.lng && p.time === latestPoint.time));
  }, [points, latestPoint]);

  return (
    <MapContainer
      className="h-full w-full trips-leaflet"
      style={{ height: "100%", width: "100%" }}
      center={latestPoint ? toLL(latestPoint) : DEFAULT_CENTER}
      zoom={11}
      scrollWheelZoom={interactive}
      dragging={interactive}
      touchZoom={interactive}
      doubleClickZoom={interactive}
      boxZoom={interactive}
      keyboard={interactive}
      zoomControl={false}
    >
      <TileLayer
        attribution='© <a href="https://openstreetmap.org/copyright">OpenStreetMap</a> contributors, SRTM | © <a href="https://opentopomap.org">OpenTopoMap</a> (CC-BY-SA)'
        url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
        maxZoom={17}
        subdomains={["a", "b", "c"] as string[]}
      />
      {showZoom && <ZoomControl position={zoomPosition} />}
      <FitBounds tracks={tracks} points={points} latestPoint={latestPoint} />

      {tracks.map((track) => {
        const pos = track.coordinates.map(toLL);
        return (
          <Fragment key={track.id}>
            <Polyline positions={pos} pathOptions={{ color: "rgba(255,255,255,0.9)", weight: 12, lineCap: "round", lineJoin: "round" }} />
            <Polyline positions={pos} pathOptions={{ color: "var(--accent)", weight: 5, lineCap: "round", lineJoin: "round" }} />
          </Fragment>
        );
      })}

      {waypoints.map((p, i) => (
        <CircleMarker
          key={`wp-${i}-${p.lat}-${p.lng}`}
          center={toLL(p)}
          radius={5}
          pathOptions={{ color: "#fff", weight: 2.5, fillColor: "var(--color-text)", fillOpacity: 0.72 }}
        >
          {(p.name || p.description) && (
            <Tooltip direction="top" offset={[0, -9]} className="ws-tip">
              {p.name && <strong>{p.name}</strong>}
              {p.name && p.description && <br />}
              {p.description && <span style={{ color: "var(--color-text-variant)" }}>{p.description}</span>}
            </Tooltip>
          )}
        </CircleMarker>
      ))}

      {latestPoint && (
        <Marker position={toLL(latestPoint)} icon={pulseIcon} zIndexOffset={1000}>
          {(latestPoint.name || latestPoint.description) && (
            <Tooltip direction="top" offset={[0, -12]} className="ws-tip">
              {latestPoint.name && <strong>{latestPoint.name}</strong>}
              {latestPoint.name && latestPoint.description && <br />}
              {latestPoint.description && <span style={{ color: "var(--color-text-variant)" }}>{latestPoint.description}</span>}
            </Tooltip>
          )}
        </Marker>
      )}
    </MapContainer>
  );
}
