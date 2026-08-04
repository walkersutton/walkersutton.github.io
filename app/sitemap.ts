import { MetadataRoute } from "next";
import { getAllPosts } from "@/lib/posts";
import { getAllProjects } from "@/lib/projects";
import { buildTripEntries } from "@/lib/trips";
import { SITE_CONFIG } from "@/lib/config";

export const dynamic = "force-static";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = getAllPosts();
  // Projects without a write-up link out (GitHub etc.) — no page to index.
  const projects = getAllProjects().filter((p) => !p.hide && p.hasContent);
  const trips = buildTripEntries();

  const staticPaths = ["", "/posts", "/projects", "/trips"];

  const staticRoutes: MetadataRoute.Sitemap = staticPaths.map((path) => ({
    url: `${SITE_CONFIG.siteUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: path === "" ? 1 : 0.8,
  }));

  const postRoutes: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${SITE_CONFIG.siteUrl}/posts/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  const projectRoutes: MetadataRoute.Sitemap = projects.map((project) => ({
    url: `${SITE_CONFIG.siteUrl}/projects/${project.slug}`,
    lastModified: project.date ? new Date(project.date) : new Date(),
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  const tripRoutes: MetadataRoute.Sitemap = trips.map((trip) => ({
    url: `${SITE_CONFIG.siteUrl}${trip.href}`,
    lastModified: trip.date ? new Date(trip.date) : new Date(),
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...staticRoutes, ...postRoutes, ...projectRoutes, ...tripRoutes];
}
