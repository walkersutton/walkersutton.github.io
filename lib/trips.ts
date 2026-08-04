import fs from "fs";
import path from "path";
import matter from "gray-matter";
import type { ReportTrack, ReportWaypoint } from "@/app/trips/[slug]/LeafletReportMap";

const tripsDirectory = path.join(process.cwd(), "content/trips");

export interface TripFrontmatter {
  title: string;
  region: string;
  draft?: boolean;
  // Activity URLs in DayMarker order — first entry belongs to the first
  // <DayMarker> in the body, and so on. Use null to skip a marker.
  strava?: (string | null)[];
}

export interface TripStats {
  distance: string;
  gained: string;
  lost: string;
}

export interface DayStat {
  distKm: number;
  gainM: number;
  lossM: number;
}

export interface Trip {
  slug: string;
  frontmatter: TripFrontmatter;
  tracks: ReportTrack[];
  waypoints: ReportWaypoint[];
  start: { lat: number; lng: number; name: string } | null;
  stats: TripStats;
  dayStats: DayStat[];  // one entry per unique date, ordered day 1…N
  stravaByLabel: Record<string, string>; // DayMarker label → activity URL
  days: number;
  date: string;      // ISO "YYYY-MM-DD" for sorting
  dateStart: string; // display "May 15"
  dateEnd: string;   // display "May 19"
  dates: string;     // display "May 15–19, 2025"
  content: string;
}

export interface TripEntry {
  name: string;
  region: string;
  date: string;
  href: string;
  stats: string;
  days: string;
  coords: [number, number][];
}

// ── GeoJSON types ─────────────────────────────────────────────────

type Coord2D = [number, number];
type Coord3D = [number, number, number];

type GeoJSONFeature = {
  type: "Feature";
  geometry:
    | { type: "LineString"; coordinates: (Coord2D | Coord3D)[] }
    | { type: "Point"; coordinates: Coord2D | Coord3D };
  properties: Record<string, string | number | null>;
};

type GeoJSONFeatureCollection = {
  type: "FeatureCollection";
  features: GeoJSONFeature[];
};

// ── Geo math ──────────────────────────────────────────────────────

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function fmtMiles(km: number): string {
  return `${Math.round(km * 0.621371)} mi`;
}

export function fmtFeet(m: number): string {
  return `${Math.round(m * 3.28084).toLocaleString("en-US")} ft`;
}

// ── Date formatting ───────────────────────────────────────────────

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function fmtDateShort(iso: string): string {
  const d = new Date(iso + "T12:00:00");
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

function fmtDateRange(startISO: string, endISO: string): string {
  const s = new Date(startISO + "T12:00:00");
  const e = new Date(endISO + "T12:00:00");
  const sm = MONTHS[s.getMonth()];
  const em = MONTHS[e.getMonth()];
  const sy = s.getFullYear();
  const ey = e.getFullYear();
  if (sy !== ey) return `${sm} ${s.getDate()}, ${sy}–${em} ${e.getDate()}, ${ey}`;
  if (s.getMonth() !== e.getMonth()) return `${sm} ${s.getDate()}–${em} ${e.getDate()}, ${ey}`;
  if (s.getDate() === e.getDate()) return `${sm} ${s.getDate()}, ${sy}`;
  return `${sm} ${s.getDate()}–${e.getDate()}, ${sy}`;
}

// ── GeoJSON parser ────────────────────────────────────────────────

type ParsedGeoJSON = {
  tracks: ReportTrack[];
  waypoints: ReportWaypoint[];
  start: { lat: number; lng: number; name: string } | null;
  stats: TripStats;
  dayStats: DayStat[];
  days: number;
  date: string;
  dateStart: string;
  dateEnd: string;
  dates: string;
};

function parseGeoJSON(slug: string): ParsedGeoJSON | null {
  const geojsonPath = path.join(tripsDirectory, `${slug}.geojson`);
  if (!fs.existsSync(geojsonPath)) return null;

  const raw = JSON.parse(fs.readFileSync(geojsonPath, "utf8")) as GeoJSONFeatureCollection;

  type RawTrack = {
    id: string;
    date: string;
    coords: [number, number][];
    distKm: number;
    gainM: number;
    lossM: number;
  };

  // Phase 1: collect raw per-track data
  const rawTracks: RawTrack[] = [];
  const waypoints: ReportWaypoint[] = [];
  let start: { lat: number; lng: number; name: string } | null = null;

  for (const feature of raw.features) {
    const { geometry, properties } = feature;

    if (geometry.type === "LineString") {
      const coords = geometry.coordinates;
      let distKm = 0;
      let gainM = 0;
      let lossM = 0;

      // Stored geometry is thinned to one point per minute, which chords off
      // switchbacks — prefer dist_m, measured on the full-resolution track.
      if (properties.dist_m != null) {
        distKm = Number(properties.dist_m) / 1000;
      } else {
        for (let i = 1; i < coords.length; i++) {
          const [lng1, lat1] = coords[i - 1];
          const [lng2, lat2] = coords[i];
          distKm += haversineKm(lat1, lng1, lat2, lng2);
        }
      }

      if (properties.vert_up_m != null && properties.vert_down_m != null) {
        gainM = Number(properties.vert_up_m);
        lossM = Number(properties.vert_down_m);
      } else if (coords[0].length === 3) {
        for (let i = 1; i < coords.length; i++) {
          const diff = (coords[i] as Coord3D)[2] - (coords[i - 1] as Coord3D)[2];
          if (diff > 0) gainM += diff;
          else lossM -= diff;
        }
      }

      rawTracks.push({
        id: String(properties.id ?? properties.source_file ?? `track-${rawTracks.length}`),
        date: properties.date ? String(properties.date) : "",
        // GeoJSON is [lng, lat, ?elev] — swap to [lat, lng] for Leaflet
        coords: coords.map(([lng, lat]) => [lat, lng]),
        distKm,
        gainM,
        lossM,
      });
    } else if (geometry.type === "Point") {
      const [lng, lat] = geometry.coordinates;
      const type = String(properties.type ?? "");
      if (type === "start") {
        start = { lat, lng, name: String(properties.name ?? "") };
      } else {
        waypoints.push({
          lat,
          lng,
          name: String(properties.name ?? ""),
          desc: String(properties.desc ?? ""),
          elev: String(properties.elev ?? ""),
        });
      }
    }
  }

  // Phase 2: build date → day mapping, assign labels, aggregate per-day stats
  const sortedDates = [...new Set(rawTracks.map((t) => t.date).filter(Boolean))].sort();
  const dateToDay = new Map(sortedDates.map((d, i) => [d, i + 1]));

  const tracks: ReportTrack[] = rawTracks.map((t) => ({
    id: t.id,
    coords: t.coords,
    label: t.date && dateToDay.has(t.date) ? `Day ${dateToDay.get(t.date)} · ${fmtDateShort(t.date)}` : undefined,
  }));

  const dayStatsMap = new Map<number, { distKm: number; gainM: number; lossM: number }>();
  for (const t of rawTracks) {
    const day = t.date ? dateToDay.get(t.date) : undefined;
    if (day != null) {
      const prev = dayStatsMap.get(day) ?? { distKm: 0, gainM: 0, lossM: 0 };
      dayStatsMap.set(day, {
        distKm: prev.distKm + t.distKm,
        gainM: prev.gainM + t.gainM,
        lossM: prev.lossM + t.lossM,
      });
    }
  }

  const dayStats: DayStat[] = sortedDates.map((_, i) => {
    return dayStatsMap.get(i + 1) ?? { distKm: 0, gainM: 0, lossM: 0 };
  });

  const totalDistKm = rawTracks.reduce((s, t) => s + t.distKm, 0);
  const totalGainM = rawTracks.reduce((s, t) => s + t.gainM, 0);
  const totalLossM = rawTracks.reduce((s, t) => s + t.lossM, 0);

  const dateStart = sortedDates[0] ?? "";
  const dateEnd = sortedDates[sortedDates.length - 1] ?? dateStart;

  if (!start && tracks.length > 0 && tracks[0].coords.length > 0) {
    const [lat, lng] = tracks[0].coords[0];
    start = { lat, lng, name: "" };
  }

  return {
    tracks,
    waypoints,
    start,
    stats: {
      distance: fmtMiles(totalDistKm),
      gained: fmtFeet(totalGainM),
      lost: fmtFeet(totalLossM),
    },
    dayStats,
    days: sortedDates.length || tracks.length,
    date: dateStart,
    dateStart: dateStart ? fmtDateShort(dateStart) : "",
    dateEnd: dateEnd ? fmtDateShort(dateEnd) : "",
    dates: dateStart ? fmtDateRange(dateStart, dateEnd) : "",
  };
}

// ── DayMarker ↔ Strava pairing ────────────────────────────────────

// Pairs the frontmatter `strava` list with the <DayMarker> tags in body
// order, so the MDX doesn't have to repeat a URL on every marker.
function pairStravaLinks(
  content: string,
  urls: (string | null)[] | undefined,
): Record<string, string> {
  if (!urls?.length) return {};
  const labels = [...content.matchAll(/<DayMarker\b[^>]*?\blabel="([^"]*)"/g)].map(
    (m) => m[1],
  );
  const pairs: Record<string, string> = {};
  labels.forEach((label, i) => {
    const url = urls[i];
    if (url) pairs[label] = url;
  });
  return pairs;
}

// ── Public API ────────────────────────────────────────────────────

export function getAllTripSlugs(options: { includeDrafts?: boolean } = {}): string[] {
  if (!fs.existsSync(tripsDirectory)) return [];
  return fs
    .readdirSync(tripsDirectory)
    .filter((f) => f.endsWith(".mdx") || f.endsWith(".md"))
    .filter((f) => {
      if (options.includeDrafts) return true;
      const { data } = matter(fs.readFileSync(path.join(tripsDirectory, f), "utf8"));
      return data.draft !== true;
    })
    .map((f) => f.replace(/\.mdx?$/, ""));
}

export function getTripBySlug(slug: string): Trip | null {
  if (!fs.existsSync(tripsDirectory)) return null;

  const mdxPath = path.join(tripsDirectory, `${slug}.mdx`);
  const mdPath = path.join(tripsDirectory, `${slug}.md`);
  const filePath = fs.existsSync(mdxPath) ? mdxPath : fs.existsSync(mdPath) ? mdPath : null;

  if (!filePath) return null;

  const raw = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(raw);
  const frontmatter = data as TripFrontmatter;

  const geo = parseGeoJSON(slug);

  return {
    slug,
    frontmatter,
    tracks: geo?.tracks ?? [],
    waypoints: geo?.waypoints ?? [],
    start: geo?.start ?? null,
    stats: geo?.stats ?? { distance: "", gained: "", lost: "" },
    dayStats: geo?.dayStats ?? [],
    stravaByLabel: pairStravaLinks(content, frontmatter.strava),
    days: geo?.days ?? 0,
    date: geo?.date ?? "",
    dateStart: geo?.dateStart ?? "",
    dateEnd: geo?.dateEnd ?? "",
    dates: geo?.dates ?? "",
    content,
  };
}

export function buildTripEntries(options: { includeDrafts?: boolean } = {}): TripEntry[] {
  return getAllTripSlugs(options)
    .map((slug): TripEntry | null => {
      const trip = getTripBySlug(slug);
      if (!trip || !trip.frontmatter.title) return null;
      return {
        name: trip.frontmatter.title,
        region: trip.frontmatter.region,
        date: trip.date,
        href: `/trips/${slug}`,
        stats: `${trip.stats.distance} · ${trip.stats.gained}`,
        days: `${trip.days} day${trip.days !== 1 ? "s" : ""}`,
        coords: trip.tracks.flatMap((t) => t.coords) as [number, number][],
      };
    })
    .filter((t): t is TripEntry => t !== null)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}
