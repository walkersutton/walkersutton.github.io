import { NextResponse } from "next/server";

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

const ENTITY_MAP: Record<string, string> = {
  amp: "&",
  apos: "'",
  gt: ">",
  lt: "<",
  quot: "\"",
};

function decodeXml(value: string) {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&([a-z]+);/gi, (_, entity: string) => ENTITY_MAP[entity] ?? `&${entity};`)
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) => String.fromCharCode(parseInt(code, 16)))
    .trim();
}

function stripTags(value: string) {
  return decodeXml(value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " "));
}

function readTag(source: string, tag: string) {
  const match = source.match(new RegExp(`<(?:[\\w-]+:)?${tag}\\b[^>]*>([\\s\\S]*?)<\\/(?:[\\w-]+:)?${tag}>`, "i"));
  return match ? decodeXml(match[1]) : undefined;
}

function readAllTags(source: string, tag: string) {
  return Array.from(
    source.matchAll(new RegExp(`<(?:[\\w-]+:)?${tag}\\b[^>]*>([\\s\\S]*?)<\\/(?:[\\w-]+:)?${tag}>`, "gi")),
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
  const latestPoint = [...allPoints]
    .filter((point) => point.time)
    .sort((a, b) => Date.parse(b.time ?? "") - Date.parse(a.time ?? ""))[0] ?? points.at(-1) ?? trackPoints.at(-1);

  return {
    tracks,
    points: points.sort((a, b) => Date.parse(b.time ?? "") - Date.parse(a.time ?? "")),
    latestPoint,
    totalPoints: allPoints.length,
  };
}

export async function GET() {
  const feedUrl = process.env.GARMIN_MAPSHARE_KML_URL ?? process.env.GARMIN_KML_FEED_URL;

  if (!feedUrl) {
    return NextResponse.json(
      {
        configured: false,
        fetchedAt: new Date().toISOString(),
        tracks: [],
        points: [],
        totalPoints: 0,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const response = await fetch(feedUrl, {
      headers: {
        Accept: "application/vnd.google-earth.kml+xml, application/xml, text/xml;q=0.9, */*;q=0.8",
      },
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      return NextResponse.json(
        { configured: true, error: `Garmin feed responded with ${response.status}` },
        { status: 502, headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=300" } },
      );
    }

    const kml = await response.text();
    const parsed = parseKml(kml);

    return NextResponse.json(
      {
        configured: true,
        fetchedAt: new Date().toISOString(),
        ...parsed,
      },
      { headers: { "Cache-Control": "s-maxage=300, stale-while-revalidate=1800" } },
    );
  } catch (error) {
    console.error("MapShare feed error:", error);

    return NextResponse.json(
      { configured: true, error: "Unable to fetch Garmin MapShare feed" },
      { status: 502, headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=300" } },
    );
  }
}
