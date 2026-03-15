import fs from "fs";
import path from "path";
import matter from "gray-matter";

const postsDirectory = path.join(process.cwd(), "content/posts");

export interface PostMetadata {
  title: string;
  date: string;
  slug: string;
  external_url?: string;
  categories?: string[];
}

export interface Post {
  metadata: PostMetadata;
  content: string;
}

export function getAllPosts(): PostMetadata[] {
  // Ensure the directory exists
  if (!fs.existsSync(postsDirectory)) {
    return [];
  }

  const fileNames = fs.readdirSync(postsDirectory);
  const allPostsData = fileNames
    .filter((fileName) => fileName.endsWith(".md") || fileName.endsWith(".mdx"))
    .map((fileName) => {
      const fullPath = path.join(postsDirectory, fileName);
      const fileContents = fs.readFileSync(fullPath, "utf8");
      const { data } = matter(fileContents);
      
      const slug = String(data.slug || fileName.replace(/\.mdx?$/, ""));

      return {
        ...data,
        title: String(data.title || ""),
        date: String(data.date || ""),
        slug,
        external_url: data.external_url ? String(data.external_url) : undefined,
      } as PostMetadata;
    });

  // Sort posts by date
  return allPostsData.sort((a, b) => (new Date(a.date) < new Date(b.date) ? 1 : -1));
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  // First, try the fast path: Does a file exist with the exact name as the slug?
  const fullPath = path.join(postsDirectory, `${slug}.md`);
  const mdxPath = path.join(postsDirectory, `${slug}.mdx`);
  
  let actualPath = "";
  if (fs.existsSync(fullPath)) {
    actualPath = fullPath;
  } else if (fs.existsSync(mdxPath)) {
    actualPath = mdxPath;
  } else {
    // Slow path: Filename does not match slug.
    // We must read all files to find the one with the correct slug in its frontmatter.
    const fileNames = fs.readdirSync(postsDirectory);
    for (const fileName of fileNames) {
      if (!fileName.endsWith('.md') && !fileName.endsWith('.mdx')) continue;
      
      const testPath = path.join(postsDirectory, fileName);
      const fileContents = fs.readFileSync(testPath, "utf8");
      const { data } = matter(fileContents);
      
      if (data.slug === slug) {
        actualPath = testPath;
        break;
      }
    }
  }

  // If we still can't find it, the post simply doesn't exist
  if (!actualPath) {
    return null;
  }

  const fileContents = fs.readFileSync(actualPath, "utf8");
  const { data, content } = matter(fileContents);

  return {
    metadata: data as PostMetadata,
    content,
  };
}

export function generateExcerpt(content: string, length: number = 269): string {
  let excerpt = content.trim();

  // Strip common markdown elements that might look bad in a short preview
  // Strip images
  excerpt = excerpt.replace(/!\[.*?\]\(.*?\)/g, "");
  // Strip HTML-like tags
  excerpt = excerpt.replace(/<[^>]*>?/gm, "");
  // Strip code blocks (roughly)
  excerpt = excerpt.replace(/```[\s\S]*?```/g, "");

  // Clean up whitespace
  excerpt = excerpt.replace(/\s+/g, " ").trim();

  if (excerpt.length > length) {
    excerpt = excerpt.substring(0, length).trim() + "...";
  }

  return excerpt;
}
