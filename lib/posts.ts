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
    .filter((fileName) => (fileName.endsWith(".md") || fileName.endsWith(".mdx")) && !fileName.startsWith("draft"))
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

export function generateExcerpt(
  content: string,
  options: { length?: number; preserveNewlines?: boolean } = {}
): string {
  const { length = 269, preserveNewlines = false } = options;
  let excerpt = content.trim();

  // Strip common markdown elements that might look bad in a short preview
  // Strip images
  excerpt = excerpt.replace(/!\[.*?\]\(.*?\)/g, "");
  // Strip HTML-like tags
  excerpt = excerpt.replace(/<[^>]*>?/gm, "");
  // Strip code blocks (roughly)
  excerpt = excerpt.replace(/```[\s\S]*?```/g, "");

  // Clean up whitespace
  if (preserveNewlines) {
    // Keep newlines but collapse multiple ones, and trim each line
    excerpt = excerpt
      .split("\n")
      .map((line) => line.trim())
      .join("\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  } else {
    // Strip markdown heading markers (e.g. ## Notes:) and list markers (- item, * item)
    // before collapsing whitespace so they don't appear as literal characters
    excerpt = excerpt.replace(/^#{1,6}\s+/gm, "");
    excerpt = excerpt.replace(/^[-*+]\s+/gm, "");
    excerpt = excerpt.replace(/\s+/g, " ").trim();
  }

  if (excerpt.length > length) {
    if (preserveNewlines) {
      // Greedily accumulate complete blocks (separated by \n\n) up to the length limit.
      // If the accumulated result is too short (the very next block alone exceeds the limit),
      // fall back to a character-truncated portion of that next block so we don't show too little.
      const blocks = excerpt.split("\n\n");
      let result = "";
      let nextBlock = "";
      for (const block of blocks) {
        const candidate = result ? result + "\n\n" + block : block;
        if (candidate.length > length) {
          nextBlock = block;
          break;
        }
        result = candidate;
      }
      // If we have nothing yet (first block already exceeds limit), or result is less than
      // half the limit, include a character-truncated portion of the next block too.
      if (!result || result.length < length / 2) {
        const extra = nextBlock || excerpt;
        const remaining = length - (result ? result.length + 2 : 0);
        const truncated = extra.substring(0, remaining).trim();
        result = result ? result + "\n\n" + truncated : truncated;
      }
      excerpt = result.trim() + "...";
    } else {
      excerpt = excerpt.substring(0, length).trim() + "...";
    }
  }

  return excerpt;
}
