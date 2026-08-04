import { readFile } from "node:fs/promises";
import path from "node:path";
import type { MapPoint, MapShareResponse, MapTrack } from "@/app/trips/mapshare";
import { encryptedEnvMessage, isEncrypted } from "@/lib/env";
import { getMapShareFeedUrl } from "@/lib/live-state";

const DUMMY_KML_PATH = path.join(
  process.cwd(),
  "public",
  "trips",
  "dummy-mapshare.kml",
);

const ENTITY_MAP: Record<string, string> = {
  amp: "&",
  apos: "'",
  gt: ">",
  lt: "<",
  quot: '"',
};

function decodeXml(value: string) {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&([a-z]+);/gi, (_, entity: string) => ENTITY_MAP[entity] ?? `&${entity};`)
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) =>
      String.fromCharCode(parseInt(code, 16)),
    )
    .trim();
}

function stripTags(value: string) {
  return decodeXml(value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " "));
}

function readTag(source: string, tag: string) {
  const match = source.match(
    new RegExp(`<(?:[\\w-]+:)?${tag}\\b[^>]*>([\\s\\S]*?)<\\/(?:[\\w-]+:)?${tag}>`, "i"),
  );
  return match ? decodeXml(match[1]) : undefined;
}

function readAllTags(source: string, tag: string) {
  return Array.from(
    source.matchAll(
      new RegExp(`<(?:[\\w-]+:)?${tag}\\b[^>]*>([\\s\\S]*?)<\\/(?:[\\w-]+:)?${tag}>`, "gi"),
    ),
    (match) => decodeXml(match[1]),
  );
}

function parseCoordinateTuples(rawCoordinates: string, times: string[] = []) {
  return rawCoordinates
    .trim()
    .split(/\s+/)
    .map((tuple, index): MapPoint | undefined => {
      const [lng, lat, elevation] = tuple.split(",").map(Number);

      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        return undefined;
      }

      return {
        lat,
        lng,
        elevation: Number.isFinite(elevation) ? elevation : undefined,
        time: times[index],
      };
    })
    .filter((point): point is MapPoint => Boolean(point));
}

function parseGxTrack(placemark: string) {
  const times = readAllTags(placemark, "when");
  const coords = readAllTags(placemark, "coord")
    .map((coord, index): MapPoint | undefined => {
      const [lng, lat, elevation] = coord.trim().split(/\s+/).map(Number);

      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        return undefined;
      }

      return {
        lat,
        lng,
        elevation: Number.isFinite(elevation) ? elevation : undefined,
        time: times[index],
      };
    })
    .filter((point): point is MapPoint => Boolean(point));

  return coords;
}

/** Sortable timestamp for a point; -Infinity when it has no usable time. */
function timeValue(point: MapPoint): number {
  const at = point.time ? Date.parse(point.time) : NaN;
  return Number.isFinite(at) ? at : -Infinity;
}

function parseKml(kml: string) {
  const placemarks = Array.from(
    kml.matchAll(/<Placemark\b[^>]*>([\s\S]*?)<\/Placemark>/gi),
    (match) => match[1],
  );
  const tracks: MapTrack[] = [];
  const points: MapPoint[] = [];

  placemarks.forEach((placemark, index) => {
    const name = readTag(placemark, "name") ?? `Track ${index + 1}`;
    const description = readTag(placemark, "description");
    const time = readTag(placemark, "when");
    const gxTrack = parseGxTrack(placemark);
    const coordinateBlocks = readAllTags(placemark, "coordinates");
    const coordinates = gxTrack.length
      ? gxTrack
      : coordinateBlocks.flatMap((block) => parseCoordinateTuples(block));

    if (coordinates.length > 1) {
      tracks.push({
        id: `${index}-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
        name: stripTags(name),
        coordinates,
      });
      return;
    }

    const [point] = coordinates;

    if (point) {
      points.push({
        ...point,
        name: stripTags(name),
        description: description ? stripTags(description) : undefined,
        time: point.time ?? time,
      });
    }
  });

  const trackPoints = tracks.flatMap((track) => track.coordinates);
  const allPoints = [...trackPoints, ...points];

  // Scan for the max rather than sorting: a single unparseable <when> makes a
  // Date.parse comparator return NaN, and an inconsistent comparator leaves the
  // whole array in an arbitrary order — which would strand the "you are here"
  // marker on some earlier point. Points with no usable time are skipped here
  // and fall back to document order below.
  let latestPoint: MapPoint | undefined;
  let latestAt = -Infinity;
  for (const point of allPoints) {
    const at = timeValue(point);
    if (at > latestAt) {
      latestAt = at;
      latestPoint = point;
    }
  }
  latestPoint ??= points.at(-1) ?? trackPoints.at(-1);

  return {
    tracks,
    // Newest first, with unparseable times sorting last instead of poisoning
    // the comparator with NaN.
    points: [...points].sort((a, b) => timeValue(b) - timeValue(a)),
    latestPoint,
    totalPoints: allPoints.length,
  };
}

async function loadDummyKml(): Promise<{ data: MapShareResponse; status: number; cacheControl: string }> {
  const kml = await readFile(DUMMY_KML_PATH, "utf8");
  const parsed = parseKml(kml);

  return {
    data: {
      configured: false,
      sample: true,
      fetchedAt: new Date().toISOString(),
      ...parsed,
    },
    status: 200,
    cacheControl: "no-store",
  };
}

// Garmin's Feed/Share endpoint takes d1 (window start) and d2 (window end).
// A d2 baked into the configured URL pins the feed to a window that ended in
// the past, so the feed keeps returning the same final position no matter how
// far the tracker has moved since — the map looks frozen while MapShare itself
// is current. Drop d2 so the window always runs to now; keep d1, which is
// usually a deliberate trip-start bound.
function withOpenEndedWindow(feedUrl: string): string {
  try {
    const url = new URL(feedUrl);
    if (!url.searchParams.has("d2")) return feedUrl;
    url.searchParams.delete("d2");
    return url.toString();
  } catch {
    // Not parseable as a URL — hand it back untouched and let fetch complain.
    return feedUrl;
  }
}

export type FeedSource =
  /** Set from /admin; wins over the environment so it can be fixed from a phone. */
  | { kind: "stored"; url: string }
  | { kind: "env"; url: string }
  /** Configured but still ciphertext, which is a misconfiguration, not "unset". */
  | { kind: "encrypted" }
  | { kind: "missing" };

export async function resolveFeedSource(): Promise<FeedSource> {
  const stored = await getMapShareFeedUrl();
  if (stored) return { kind: "stored", url: stored };

  const raw = process.env.GARMIN_MAPSHARE_KML_URL ?? process.env.GARMIN_KML_FEED_URL;
  if (!raw) return { kind: "missing" };
  if (isEncrypted(raw)) return { kind: "encrypted" };
  return { kind: "env", url: raw };
}

export type MapShareDiagnostics = {
  configured: boolean;
  source: FeedSource["kind"];
  feedHost?: string;
  hasD1: boolean;
  hasD2: boolean;
  status?: number;
  bytes?: number;
  placemarks?: number;
  tracks?: number;
  points?: number;
  totalPoints?: number;
  newest?: string;
  oldest?: string;
  error?: string;
  rawHead?: string;
  rawLastPlacemark?: string;
};

/**
 * Fetches the configured feed with every cache bypassed and reports what came
 * back, so a stale map can be diagnosed from a phone without DevTools. Never
 * returns the feed URL itself — it embeds the MapShare id, which is the only
 * thing protecting the location history — just its host and which date-window
 * params are set.
 */
export async function getMapShareDiagnostics(): Promise<MapShareDiagnostics> {
  const source = await resolveFeedSource();
  if (source.kind === "missing") return { configured: false, source: "missing", hasD1: false, hasD2: false };

  // Checked before parsing: "encrypted:..." is a valid URL as far as the URL
  // constructor is concerned (opaque scheme, blank host, no query), so it would
  // otherwise be reported as a feed with no bounds that simply failed to fetch.
  if (source.kind === "encrypted") {
    return {
      configured: true,
      source: "encrypted",
      hasD1: false,
      hasD2: false,
      error: encryptedEnvMessage("GARMIN_MAPSHARE_KML_URL"),
    };
  }

  const feedUrl = source.url;

  let feedHost: string | undefined;
  let hasD1 = false;
  let hasD2 = false;
  try {
    const url = new URL(feedUrl);
    feedHost = url.host;
    hasD1 = url.searchParams.has("d1");
    hasD2 = url.searchParams.has("d2");
  } catch {
    // Leave the fields unset; the fetch below will report the real problem.
  }

  try {
    const response = await fetch(withOpenEndedWindow(feedUrl), {
      headers: {
        Accept:
          "application/vnd.google-earth.kml+xml, application/xml, text/xml;q=0.9, */*;q=0.8",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return {
        configured: true,
        source: source.kind,
        feedHost,
        hasD1,
        hasD2,
        status: response.status,
        error: `Garmin responded with ${response.status}`,
      };
    }

    const kml = await response.text();
    const parsed = parseKml(kml);
    const placemarks = kml.match(/<Placemark\b/gi)?.length ?? 0;
    const times = [...parsed.tracks.flatMap((t) => t.coordinates), ...parsed.points]
      .map((p) => (p.time ? Date.parse(p.time) : NaN))
      .filter((n) => Number.isFinite(n));

    const lastPlacemark = [...kml.matchAll(/<Placemark\b[\s\S]*?<\/Placemark>/gi)].at(-1)?.[0];

    return {
      configured: true,
      source: source.kind,
      feedHost,
      hasD1,
      hasD2,
      status: response.status,
      bytes: kml.length,
      placemarks,
      tracks: parsed.tracks.length,
      points: parsed.points.length,
      totalPoints: parsed.totalPoints,
      newest: times.length ? new Date(Math.max(...times)).toISOString() : undefined,
      oldest: times.length ? new Date(Math.min(...times)).toISOString() : undefined,
      rawHead: kml.slice(0, 900),
      rawLastPlacemark: lastPlacemark?.slice(0, 900),
    };
  } catch (error) {
    return {
      configured: true,
      source: source.kind,
      feedHost,
      hasD1,
      hasD2,
      error: (error as Error).message || "Fetch failed",
    };
  }
}

// Shared by the /api/mapshare route (client polling) and server components
// that need the live feed before first paint (avoids a client-side flash of
// stale/fallback content while the client's own fetch is in flight).
export async function getMapShareData(options?: {
  forceDummy?: boolean;
}): Promise<{ data: MapShareResponse; status: number; cacheControl: string }> {
  const forceDummy = options?.forceDummy || process.env.TRIPS_USE_DUMMY_KML === "true";

  if (forceDummy) {
    return loadDummyKml();
  }

  const source = await resolveFeedSource();

  // Ciphertext is truthy, so without this it reaches fetch() and comes back as
  // a bare "fetch failed" — indistinguishable from Garmin being down, which is
  // a very different thing to go and fix.
  if (source.kind === "encrypted") {
    const message = encryptedEnvMessage("GARMIN_MAPSHARE_KML_URL");
    console.error(`MapShare feed misconfigured: ${message}`);
    return {
      data: {
        configured: false,
        fetchedAt: new Date().toISOString(),
        tracks: [],
        points: [],
        totalPoints: 0,
        error: message,
      },
      status: 500,
      cacheControl: "no-store",
    };
  }

  const feedUrl = source.kind === "missing" ? undefined : source.url;

  if (!feedUrl) {
    try {
      return await loadDummyKml();
    } catch {
      return {
        data: {
          configured: false,
          fetchedAt: new Date().toISOString(),
          tracks: [],
          points: [],
          totalPoints: 0,
        },
        status: 200,
        cacheControl: "no-store",
      };
    }
  }

  try {
    const response = await fetch(withOpenEndedWindow(feedUrl), {
      headers: {
        Accept: "application/vnd.google-earth.kml+xml, application/xml, text/xml;q=0.9, */*;q=0.8",
      },
      // Never serve a cached KML body: this is a live position feed, and the
      // Next data cache would happily hand back a point that's minutes old.
      // Request rate is bounded by the CDN cache on /api/mapshare instead.
      cache: "no-store",
    });

    if (!response.ok) {
      return {
        data: { configured: true, fetchedAt: new Date().toISOString(), tracks: [], points: [], totalPoints: 0, error: `Garmin feed responded with ${response.status}` },
        status: 502,
        cacheControl: "public, s-maxage=15, stale-while-revalidate=0",
      };
    }

    const kml = await response.text();
    const parsed = parseKml(kml);

    return {
      data: {
        configured: true,
        fetchedAt: new Date().toISOString(),
        ...parsed,
      },
      status: 200,
      // Short edge cache so bursts of viewers collapse into ~1 Garmin request
      // per minute, without a long stale-while-revalidate window handing out
      // an out-of-date position for half an hour.
      cacheControl: "public, s-maxage=60, stale-while-revalidate=60",
    };
  } catch (error) {
    console.error("MapShare feed error:", error);

    return {
      data: { configured: true, fetchedAt: new Date().toISOString(), tracks: [], points: [], totalPoints: 0, error: "Unable to fetch Garmin MapShare feed" },
      status: 502,
      cacheControl: "public, s-maxage=15, stale-while-revalidate=0",
    };
  }
}
