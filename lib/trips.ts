import fs from "fs";
import path from "path";
import matter from "gray-matter";
import type { ReportTrack, ReportWaypoint } from "@/app/trips/[slug]/LeafletReportMap";

const tripsDirectory = path.join(process.cwd(), "content/trips");

export interface TripFrontmatter {
  title: string;
  region: string;
  dates: string;
  dateStart: string;
  dateEnd: string;
  days: number;
  stats: { distance: string; gained: string; lost: string };
  tracks: ReportTrack[];
  waypoints: ReportWaypoint[];
  start: { lat: number; lng: number; name: string };
  prev?: { name: string; href: string; meta: string };
  next?: { name: string; href: string; meta: string };
}

export interface Trip {
  slug: string;
  frontmatter: TripFrontmatter;
  content: string;
}

export function getAllTripSlugs(): string[] {
  if (!fs.existsSync(tripsDirectory)) return [];
  return fs
    .readdirSync(tripsDirectory)
    .filter((f) => f.endsWith(".mdx") || f.endsWith(".md"))
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

  return {
    slug,
    frontmatter: data as TripFrontmatter,
    content,
  };
}
