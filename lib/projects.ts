import fs from "fs";
import path from "path";
import matter from "gray-matter";

const projectsDirectory = path.join(process.cwd(), "content/projects");

export interface ProjectMetadata {
  name: string;
  slug: string;
  year?: string;
  hide?: boolean;
  href?: string;
  githubUrl?: string;
  image?: string;
  still?: string;
  blurb: string;
}

export interface Project {
  metadata: ProjectMetadata;
  content: string;
}

export function getAllProjects(): ProjectMetadata[] {
  if (!fs.existsSync(projectsDirectory)) return [];

  const fileNames = fs.readdirSync(projectsDirectory);
  return fileNames
    .filter((f) => f.endsWith(".mdx") || f.endsWith(".md"))
    .map((fileName) => {
      const fullPath = path.join(projectsDirectory, fileName);
      const { data } = matter(fs.readFileSync(fullPath, "utf8"));
      const slug = String(data.slug || fileName.replace(/\.mdx?$/, ""));
      return { ...data, slug } as ProjectMetadata;
    });
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
