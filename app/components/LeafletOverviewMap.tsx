"use client";

import L from "leaflet";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import {
  CircleMarker,
  MapContainer,
  Marker,
  Polyline,
  TileLayer,
  Tooltip,
  useMap,
} from "react-leaflet";
import type { LatLngBoundsExpression, LatLngExpression } from "leaflet";
import { useRouter } from "next/navigation";

type TripEntry = {
  name: string;
  region: string;
  date: string;
  href: string;
  coords: [number, number][];
};

function usePulseIcon() {
  return useMemo(
    () =>
      L.divIcon({
        className: "",
        html: `<div style="position:relative;width:16px;height:16px">
      <div class="trips-pulse-ring" style="position:absolute;top:-6px;left:-6px;right:-6px;bottom:-6px"></div>
      <div class="trips-pulse-ring2" style="position:absolute;top:-2px;left:-2px;right:-2px;bottom:-2px"></div>
      <div class="trips-pulse-core" style="position:absolute;top:2px;left:2px;right:2px;bottom:2px"></div>
    </div>`,
        iconSize: [16, 16] as L.PointExpression,
        iconAnchor: [8, 8] as L.PointExpression,
      }),
    [],
  );
}

function MapController({ coords, fitMinZoom = 0 }: { coords: LatLngExpression[]; fitMinZoom?: number }) {
  const map = useMap();
  const minZoom = useRef<number | null>(null);

  useEffect(() => {
    if (coords.length > 1) {
      map.fitBounds(coords as LatLngBoundsExpression, { padding: [40, 60], maxZoom: 9 });
      map.once("moveend", () => {
        if (fitMinZoom && map.getZoom() < fitMinZoom) {
          map.setZoom(fitMinZoom);
        }
        minZoom.current = map.getZoom();
      });
    }
  }, [coords, map, fitMinZoom]);

  useEffect(() => {
    const el = map.getContainer();
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (e.deltaY < 0) {
        map.zoomIn();
      } else if (e.deltaY > 0 && (minZoom.current === null || map.getZoom() > minZoom.current)) {
        map.zoomOut();
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [map]);

  return null;
}

export default function LeafletOverviewMap({
  trips,
  hoveredTrip,
  fitMinZoom = 0,
  liveTrack,
  liveLatest,
}: {
  trips: TripEntry[];
  hoveredTrip?: string | null;
  fitMinZoom?: number;
  liveTrack?: [number, number][];
  liveLatest?: { lat: number; lng: number };
}) {
  const router = useRouter();
  const pulseIcon = usePulseIcon();
  const [mapHoveredTrip, setMapHoveredTrip] = useState<string | null>(null);
  const livePositions = (liveTrack ?? []) as LatLngExpression[];
  const hasLive = livePositions.length > 0;
  const allCoords = useMemo(
    () => trips.flatMap((t) => t.coords as LatLngExpression[]),
    [trips],
  );
  // When a live trip is present, focus the map on it; otherwise frame all trips.
  const focusCoords = hasLive ? livePositions : allCoords;

  return (
    <MapContainer
      className="h-full w-full trips-leaflet"
      center={[47.75, -122.1]}
      zoom={7}
      scrollWheelZoom={false}
      zoomControl={false}
      dragging
      touchZoom
      doubleClickZoom={false}
      boxZoom={false}
      keyboard={false}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='© <a href="https://openstreetmap.org/copyright">OpenStreetMap</a> contributors, SRTM | © <a href="https://opentopomap.org">OpenTopoMap</a> (CC-BY-SA)'
        url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
        maxZoom={17}
        subdomains={["a", "b", "c"] as string[]}
      />
      <MapController coords={focusCoords} fitMinZoom={fitMinZoom} />

      {/* While a trip is live, show only its route — hide the past trips. */}
      {!hasLive &&
        trips.map((trip) => {
        const positions = trip.coords as LatLngExpression[];
        const effectiveHover = mapHoveredTrip ?? hoveredTrip;
        const isHovered = effectiveHover === trip.name;
        const hasHover = effectiveHover != null;
        const opacity = hasHover ? (isHovered ? 1 : 0.25) : 0.5;
        return (
          <Fragment key={trip.name}>
            <Polyline
              positions={positions}
              pathOptions={{
                color: "rgba(255,255,255,0.85)",
                weight: 9,
                lineCap: "round",
                opacity,
              }}
            />
            <Polyline
              positions={positions}
              pathOptions={{
                color: "#1a1a1a",
                weight: 4,
                opacity,
                lineCap: "round",
              }}
              className="trips-map-route"
              eventHandlers={{
                click: () => router.push(trip.href),
                mouseover: () => setMapHoveredTrip(trip.name),
                mouseout: () => setMapHoveredTrip(null),
              }}
            >
              <Tooltip sticky className="ws-tip">
                <strong>{trip.name}</strong>
                <br />
                <span style={{ color: "var(--color-text-variant)" }}>
                  {trip.region} · {trip.date}
                </span>
              </Tooltip>
            </Polyline>
            <CircleMarker
              center={positions[0]}
              radius={4}
              pathOptions={{
                color: "#fff",
                weight: 2.5,
                fillColor: "#1a1a1a",
                fillOpacity: opacity,
                opacity: 1,
              }}
            />
          </Fragment>
        );
      })}

      {hasLive && (
        <>
          <Polyline
            positions={livePositions}
            pathOptions={{
              color: "rgba(255,255,255,0.9)",
              weight: 10,
              lineCap: "round",
              lineJoin: "round",
            }}
          />
          <Polyline
            positions={livePositions}
            pathOptions={{
              color: "var(--accent-green)",
              weight: 4.5,
              lineCap: "round",
              lineJoin: "round",
            }}
          />
        </>
      )}

      {liveLatest && (
        <Marker
          position={[liveLatest.lat, liveLatest.lng]}
          icon={pulseIcon}
          zIndexOffset={1000}
        />
      )}
    </MapContainer>
  );
}
