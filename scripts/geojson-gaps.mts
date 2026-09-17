/**
 * Find the straight "as the crow flies" lines in a trip's geojson.
 *
 *   pnpm gaps content/trips/pacific-to-atlantic.geojson
 *   pnpm gaps content/trips/*.geojson --ratio 12
 *
 * Each LineString is drawn as one Leaflet polyline, and Leaflet joins every
 * consecutive pair of coordinates with a straight segment — it has no idea a
 * gap in the recording happened. So a line that cuts across the landscape is
 * never a rendering artifact: it is two points in the same LineString that are
 * far apart, and this prints them, worst first, with a maps link to each.
 *
 * A gap is not automatically wrong. A ferry, a train, a lift home, or a paused
 * recorder all leave one legitimately. What the list separates is which.
 *
 * Gaps are ranked by how many times the track's own median spacing they are,
 * not by raw distance. Stored geometry is thinned to one point per minute, so
 * baseline spacing is whatever a minute covers — 0.05 mi walking, 0.3 mi
 * riding, 0.7 mi descending — and a fixed mileage threshold either buries a
 * hiking trip's real gaps or drowns a road trip in ordinary ones. A multiple of
 * the median means the same thing on both.
 *
 * Flags:
 *   --ratio <n>  flag gaps this many times the track's median, default 8
 *   --min <mi>   absolute floor, so a slow track's noise stays quiet, default 0.25
 *   --top <n>    how many to print per file, default 12
 */
import { readFile } from "node:fs/promises";
import { basename } from "node:path";

type Coord = [number, number] | [number, number, number];

interface Feature {
  type: string;
  geometry: { type: string; coordinates: Coord[] | Coord };
  properties: Record<string, string | number | null>;
}

interface Gap {
  file: string;
  track: string;
  date: string;
  /** Index of the point the jump starts from. */
  index: number;
  points: number;
  miles: number;
  /** How many times the track's median spacing this jump is. */
  ratio: number;
  from: [number, number];
  to: [number, number];
}

function haversineMi(a: [number, number], b: [number, number]): number {
  const R = 3958.8;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b[0] - a[0]);
  const dLon = toRad(b[1] - a[1]);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function parseArgs(argv: string[]): { files: string[]; min: number; ratio: number; top: number } {
  const files: string[] = [];
  let min = 0.25;
  let ratio = 8;
  let top = 12;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--min") min = Number(argv[++i]);
    else if (argv[i] === "--ratio") ratio = Number(argv[++i]);
    else if (argv[i] === "--top") top = Number(argv[++i]);
    else if (argv[i].startsWith("--")) throw new Error(`unknown flag: ${argv[i]}`);
    else files.push(argv[i]);
  }
  return { files, min, ratio, top };
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

async function gapsIn(
  file: string,
  min: number,
  minRatio: number,
): Promise<{ gaps: Gap[]; tracks: number; medians: number[] }> {
  const raw = JSON.parse(await readFile(file, "utf8")) as { features: Feature[] };
  const gaps: Gap[] = [];
  const medians: number[] = [];
  let tracks = 0;

  for (const feature of raw.features ?? []) {
    if (feature.geometry?.type !== "LineString") continue;
    tracks += 1;

    // geojson is [lng, lat]; compare in [lat, lng].
    const coords = (feature.geometry.coordinates as Coord[]).map(
      ([lng, lat]) => [lat, lng] as [number, number],
    );
    if (coords.length < 3) continue;

    const track = String(
      feature.properties?.id ?? feature.properties?.source_file ?? `track-${tracks}`,
    );
    const date = feature.properties?.date ? String(feature.properties.date) : "";

    const steps: number[] = [];
    for (let i = 1; i < coords.length; i++) steps.push(haversineMi(coords[i - 1], coords[i]));

    const baseline = median(steps);
    medians.push(baseline);
    // A track whose points are all but coincident has no meaningful median to
    // divide by; the absolute floor is the only usable test there.
    const threshold = baseline > 0 ? Math.max(min, baseline * minRatio) : min;

    steps.forEach((miles, step) => {
      if (miles < threshold) return;
      const i = step + 1;
      gaps.push({
        file: basename(file),
        track,
        date,
        index: i - 1,
        points: coords.length,
        miles,
        ratio: baseline > 0 ? miles / baseline : Infinity,
        from: coords[i - 1],
        to: coords[i],
      });
    });
  }
  return { gaps: gaps.sort((a, b) => b.ratio - a.ratio), tracks, medians };
}

async function main() {
  const { files, min, ratio, top } = parseArgs(process.argv.slice(2));
  if (files.length === 0) {
    console.error("usage: pnpm gaps <file.geojson...> [--ratio <n>] [--min <mi>] [--top <n>]");
    process.exitCode = 1;
    return;
  }

  for (const file of files) {
    const { gaps, tracks, medians } = await gapsIn(file, min, ratio);
    const name = basename(file);
    const baseline = median(medians);
    const spacing = `points sit ~${baseline.toFixed(2)} mi apart`;

    if (gaps.length === 0) {
      console.log(`${name}  ${tracks} tracks, ${spacing}, nothing over ${ratio}x that`);
      continue;
    }

    const total = gaps.reduce((sum, gap) => sum + gap.miles, 0);
    console.log(
      `\n${name}  ${tracks} tracks, ${spacing}\n` +
        `  ${gaps.length} jump(s) over ${ratio}x that, ${total.toFixed(1)} mi of straight line`,
    );
    for (const gap of gaps.slice(0, top)) {
      const where = `${gap.from[0].toFixed(4)},${gap.from[1].toFixed(4)}`;
      const label = [gap.track, gap.date].filter(Boolean).join(" ");
      console.log(
        `  ${gap.miles.toFixed(1).padStart(7)} mi  ${`${Math.round(gap.ratio)}x`.padStart(5)}  ` +
          `${label}  point ${gap.index}/${gap.points}\n` +
          `           https://www.google.com/maps/search/?api=1&query=${where}`,
      );
    }
    if (gaps.length > top) console.log(`  … ${gaps.length - top} more`);
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
