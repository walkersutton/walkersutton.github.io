import fs from "fs";
import path from "path";
import matter from "gray-matter";

const projectsDirectory = path.join(process.cwd(), "content/projects");

export interface ProjectMetadata {
  name: string;
  slug: string;
  date?: string; // ISO date (YYYY-MM-DD) — sorting, displayed year, sitemap lastModified
  draft?: boolean;
  hide?: boolean; // excluded from sitemap and "latest", but still listed
  href?: string;
  githubUrl?: string;
  tiktokUrl?: string;
  image?: string;
  still?: string;
  blurb: string;
  hasContent?: boolean; // true when the mdx body has prose (set by getAllProjects)
}

// Projects without a write-up don't get sent to /projects/<slug> — kick to the
// best external link instead (GitHub first).
export function getProjectLink(p: ProjectMetadata): { href: string; external: boolean } {
  if (!p.hasContent) {
    const external =
      p.githubUrl ??
      (p.href && p.href !== "#" ? p.href : undefined) ??
      p.tiktokUrl;
    if (external) return { href: external, external: true };
  }
  return { href: `/projects/${p.slug}`, external: false };
}

export interface Project {
  metadata: ProjectMetadata;
  content: string;
}

export function getAllProjects(options: { includeDrafts?: boolean } = {}): ProjectMetadata[] {
  if (!fs.existsSync(projectsDirectory)) return [];

  const fileNames = fs.readdirSync(projectsDirectory);
  return fileNames
    .filter((f) => f.endsWith(".mdx") || f.endsWith(".md"))
    .map((fileName) => {
      const fullPath = path.join(projectsDirectory, fileName);
      const { data, content } = matter(fs.readFileSync(fullPath, "utf8"));
      const slug = String(data.slug || fileName.replace(/\.mdx?$/, ""));
      return { ...data, slug, hasContent: content.trim().length > 0 } as ProjectMetadata;
    })
    .filter((p) => options.includeDrafts || !p.draft);
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  if (!fs.existsSync(projectsDirectory)) return null;

  const candidates = [`${slug}.mdx`, `${slug}.md`];
  let actualPath = "";

  for (const candidate of candidates) {
    const p = path.join(projectsDirectory, candidate);
    if (fs.existsSync(p)) {
      actualPath = p;
      break;
    }
  }

  if (!actualPath) {
    for (const fileName of fs.readdirSync(projectsDirectory)) {
      if (!fileName.endsWith(".md") && !fileName.endsWith(".mdx")) continue;
      const p = path.join(projectsDirectory, fileName);
      const { data } = matter(fs.readFileSync(p, "utf8"));
      if (data.slug === slug) {
        actualPath = p;
        break;
      }
    }
  }

  if (!actualPath) return null;

  const { data, content } = matter(fs.readFileSync(actualPath, "utf8"));
  return { metadata: data as ProjectMetadata, content };
}
