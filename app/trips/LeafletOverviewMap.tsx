"use client";

import { Fragment, useEffect, useMemo } from "react";
import { CircleMarker, MapContainer, Polyline, TileLayer, Tooltip, useMap } from "react-leaflet";
import type { LatLngBoundsExpression, LatLngExpression } from "leaflet";

type TripEntry = {
  name: string;
  region: string;
  date: string;
  coords: [number, number][];
};

function FitBounds({ coords }: { coords: LatLngExpression[] }) {
  const map = useMap();
  useEffect(() => {
    if (coords.length > 1) {
      map.fitBounds(coords as LatLngBoundsExpression, { padding: [40, 60], maxZoom: 9 });
    }
  }, [coords, map]);
  return null;
}

export default function LeafletOverviewMap({ trips }: { trips: TripEntry[] }) {
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
      <FitBounds coords={allCoords} />

      {trips.map((trip, i) => {
        const positions = trip.coords as LatLngExpression[];
        const opacity = i === 0 ? 1 : i === 1 ? 0.72 : 0.52;
        return (
          <Fragment key={trip.name}>
            <Polyline
              positions={positions}
              pathOptions={{ color: "rgba(255,255,255,0.85)", weight: 9, lineCap: "round" }}
            />
            <Polyline
              positions={positions}
              pathOptions={{ color: "#1a1a1a", weight: 4, opacity, lineCap: "round" }}
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
