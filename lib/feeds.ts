import { getAllPosts, getPostBySlug, generateExcerpt } from "./posts";
import { marked } from "marked";
import { SITE_CONFIG } from "./config";

function escapeXml(unsafe: string) {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case "&":
        return "&amp;";
      case "'":
        return "&apos;";
      case '"':
        return "&quot;";
      default:
        return c;
    }
  });
}

function formatRssDate(dateStr: string): string {
  const d = new Date(dateStr);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const day = d.getUTCDate().toString().padStart(2, "0");
  const month = months[d.getUTCMonth()];
  const year = d.getUTCFullYear();
  const hours = d.getUTCHours().toString().padStart(2, "0");
  const minutes = d.getUTCMinutes().toString().padStart(2, "0");
  const seconds = d.getUTCSeconds().toString().padStart(2, "0");
  return `${day} ${month} ${year} ${hours}:${minutes}:${seconds} GMT`;
}

export async function generateRssFeed() {
  const postsMetadata = getAllPosts();
  const posts = await Promise.all(
    postsMetadata.map(async (meta) => {
      const fullPost = await getPostBySlug(meta.slug);
      const content = fullPost?.content || "";
      const url = meta.external_url || `${SITE_CONFIG.siteUrl}/blog/${meta.slug}`;
      
      let htmlContent: string;
      if (meta.external_url) {
        const excerpt = generateExcerpt(content, { preserveNewlines: true });
        htmlContent = await marked.parse(excerpt);
        htmlContent += `<p><a href="${url}">Read full post</a></p>`;
      } else {
        htmlContent = await marked.parse(content);
      }
      
      return { ...meta, htmlContent };
    }),
  );

  const itemsXml = posts
    .map((post) => {
      const url = post.external_url || `${SITE_CONFIG.siteUrl}/blog/${post.slug}`;
      const guid = `/blog/${post.slug}`;
      const categoriesXml = (post.categories || [])
        .map((cat) => `<category>${escapeXml(cat)}</category>`)
        .join("\n  ");
      
      return `
<item>
  <guid>${guid}</guid>
  <title>${escapeXml(post.title)}</title>
  <link>${url}</link>
  ${categoriesXml ? categoriesXml + "\n  " : ""}<pubDate>${formatRssDate(post.date)}</pubDate>
  <description>${escapeXml(post.htmlContent)}</description>
</item>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <atom:link href="${SITE_CONFIG.siteUrl}/rss.xml" rel="self" type="application/rss+xml" />
    <title>${SITE_CONFIG.title}</title>
    <link>${SITE_CONFIG.siteUrl}/blog</link>
    <description>${SITE_CONFIG.description}</description>
    <language>en-us</language>
    ${itemsXml}
  </channel>
</rss>`;
}

export async function generateAtomFeed() {
  const postsMetadata = getAllPosts();
  const posts = await Promise.all(
    postsMetadata.map(async (meta) => {
      const fullPost = await getPostBySlug(meta.slug);
      const content = fullPost?.content || "";
      const url = meta.external_url || `${SITE_CONFIG.siteUrl}/blog/${meta.slug}`;
      
      let htmlContent: string;
      if (meta.external_url) {
        const excerpt = generateExcerpt(content, { preserveNewlines: true });
        htmlContent = await marked.parse(excerpt);
        htmlContent += `<p><a href="${url}">Read full post</a></p>`;
      } else {
        htmlContent = await marked.parse(content);
      }
      
      return { ...meta, htmlContent };
    }),
  );

  const entriesXml = posts
    .map((post) => {
      const url = post.external_url || `${SITE_CONFIG.siteUrl}/blog/${post.slug}`;
      return `
  <entry>
    <title>${escapeXml(post.title)}</title>
    <link href="${url}" />
    <id>${url}</id>
    <updated>${new Date(post.date).toISOString()}</updated>
    <content type="html">${escapeXml(post.htmlContent)}</content>
  </entry>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>${SITE_CONFIG.title}</title>
  <link href="${SITE_CONFIG.siteUrl}/atom.xml" rel="self" />
  <link href="${SITE_CONFIG.siteUrl}" />
  <updated>${new Date().toISOString()}</updated>
  <id>${SITE_CONFIG.siteUrl}</id>
  <author>
    <name>Walker Sutton</name>
  </author>
  ${entriesXml}
</feed>`;
}

export async function generateJsonFeed() {
  const postsMetadata = getAllPosts();
  const items = await Promise.all(
    postsMetadata.map(async (post) => {
      const url = post.external_url || `${SITE_CONFIG.siteUrl}/blog/${post.slug}`;
      const fullPost = await getPostBySlug(post.slug);
      const content = fullPost?.content || "";
      
      let htmlContent: string;
      if (post.external_url) {
        const excerpt = generateExcerpt(content, { preserveNewlines: true });
        htmlContent = await marked.parse(excerpt);
        htmlContent += `<p><a href="${url}">Read full post</a></p>`;
      } else {
        htmlContent = await marked.parse(content);
      }
      
      return {
        id: url,
        url: url,
        title: post.title,
        content_html: htmlContent,
        date_published: new Date(post.date).toISOString(),
      };
    }),
  );

  return JSON.stringify(
    {
      version: "https://jsonfeed.org/version/1.1",
      title: SITE_CONFIG.title,
      home_page_url: `${SITE_CONFIG.siteUrl}/blog`,
      feed_url: `${SITE_CONFIG.siteUrl}/feed.json`,
      description: SITE_CONFIG.description,
      items: items,
    },
    null,
    2,
  );
}
