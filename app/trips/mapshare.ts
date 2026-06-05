export type MapPoint = {
  lat: number;
  lng: number;
  elevation?: number;
  time?: string;
  name?: string;
  description?: string;
};

export type MapTrack = {
  id: string;
  name: string;
  coordinates: MapPoint[];
};

export type MapShareResponse = {
  configured: boolean;
  sample?: boolean;
  fetchedAt: string;
  tracks: MapTrack[];
  points: MapPoint[];
  latestPoint?: MapPoint;
  totalPoints: number;
  error?: string;
};

export const EMPTY_MAPSHARE_RESPONSE: MapShareResponse = {
  configured: false,
  fetchedAt: "",
  tracks: [],
  points: [],
  totalPoints: 0,
};

function haversineM(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
) {
  const radiusM = 6371000;
  const radians = Math.PI / 180;
  const latitudeA = a.lat * radians;
  const latitudeB = b.lat * radians;
  const latitudeDelta = (b.lat - a.lat) * radians;
  const longitudeDelta = (b.lng - a.lng) * radians;
  const x =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(latitudeA) *
      Math.cos(latitudeB) *
      Math.sin(longitudeDelta / 2) ** 2;

  return radiusM * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

export function computeMapShareStats(data: MapShareResponse) {
  let distanceM = 0;
  let gainM = 0;
  let lossM = 0;
  let earliestMs: number | null = null;
  let latestMs: number | null = null;

  const recordTime = (time?: string) => {
    if (!time) return;
    const milliseconds = Date.parse(time);
    if (Number.isNaN(milliseconds)) return;
    if (earliestMs === null || milliseconds < earliestMs) {
      earliestMs = milliseconds;
    }
    if (latestMs === null || milliseconds > latestMs) {
      latestMs = milliseconds;
    }
  };

  data.tracks.forEach((track) => {
    track.coordinates.forEach((point, index) => {
      if (index > 0) {
        const previous = track.coordinates[index - 1];
        distanceM += haversineM(previous, point);

        if (previous.elevation != null && point.elevation != null) {
          const delta = point.elevation - previous.elevation;
          if (delta > 0) gainM += delta;
          else lossM -= delta;
        }
      }

      recordTime(point.time);
    });
  });

  data.points.forEach((point) => recordTime(point.time));

  return {
    distMi: distanceM / 1609.344,
    gainFt: gainM * 3.28084,
    lossFt: lossM * 3.28084,
    elapsedMs:
      earliestMs !== null && latestMs !== null
        ? latestMs - earliestMs
        : null,
  };
}

export function formatMiles(miles: number) {
  return miles > 0 ? `${miles.toFixed(1)} mi` : "—";
}

export function formatFeet(feet: number) {
  return feet > 0 ? `${Math.round(feet).toLocaleString()} ft` : "—";
}

export function formatElevationFeet(elevation?: number) {
  return elevation != null
    ? `${Math.round(elevation * 3.28084).toLocaleString()} ft`
    : "—";
}

export function formatElapsed(milliseconds: number | null) {
  if (!milliseconds || milliseconds <= 0) return "—";
  const minutes = Math.round(milliseconds / 60000);
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const remainingMinutes = minutes % 60;

  if (days > 0) return `${days}d ${hours}h ${remainingMinutes}m`;
  if (hours > 0) return `${hours}h ${remainingMinutes}m`;
  return `${remainingMinutes}m`;
}

export function formatUpdated(time?: string) {
  if (!time) return "";
  const date = new Date(time);
  if (Number.isNaN(date.getTime())) return "";

  return `Updated ${new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date)}`;
}
