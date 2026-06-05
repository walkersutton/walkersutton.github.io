"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import {
  CircleMarker,
  MapContainer,
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

function MapController({ coords }: { coords: LatLngExpression[] }) {
  const map = useMap();
  const minZoom = useRef<number | null>(null);

  useEffect(() => {
    if (coords.length > 1) {
      map.fitBounds(coords as LatLngBoundsExpression, { padding: [40, 60], maxZoom: 9 });
      map.once("moveend", () => { minZoom.current = map.getZoom(); });
    }
  }, [coords, map]);

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
}: {
  trips: TripEntry[];
  hoveredTrip?: string | null;
}) {
  const router = useRouter();
  const [mapHoveredTrip, setMapHoveredTrip] = useState<string | null>(null);
  const allCoords = useMemo(
    () => trips.flatMap((t) => t.coords as LatLngExpression[]),
    [trips],
  );

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
      <MapController coords={allCoords} />

      {trips.map((trip) => {
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
    </MapContainer>
  );
}
