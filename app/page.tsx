import type React from "react";
import projects from "@/data/projects.json";
import { getAllPosts, getPostBySlug, generateExcerpt } from "@/lib/posts";
import { ProjectHomeGrid, type ProjectRowData } from "./components/ProjectRow";
import PostItem from "./components/PostItem";
import PageContainer from "./components/PageContainer";
import SectionBar from "./components/SectionBar";

export default async function Home() {
  const visible = projects.filter((p) => !p.hide) as ProjectRowData[];
  const digital = visible.filter((p) => p.category !== "physical");
  const physical = visible.filter((p) => p.category === "physical");

  const postsMetadata = getAllPosts().slice(0, 4);
  const posts = await Promise.all(
    postsMetadata.map(async (meta) => {
      const full = await getPostBySlug(meta.slug);
      const excerpt = generateExcerpt(full?.content ?? "", { length: 140 });
      return { ...meta, excerpt };
    })
  );

  const latestPost = posts[0];

  return (
    <PageContainer>
      {/* Hero */}
      <section className="pt-12 pb-4 max-w-[820px]">
        <div
          className="flex flex-wrap gap-4 text-[13px] font-medium mb-5"
          style={{ color: "var(--color-text-variant)" }}
        >
          <span>New York</span>
          {latestPost && (
            <a
              href={latestPost.external_url ?? `/blog/${latestPost.slug}`}
              target={latestPost.external_url ? "_blank" : undefined}
              rel={latestPost.external_url ? "noopener noreferrer" : undefined}
              style={{
                color: "var(--color-text-variant)",
                textDecoration: "underline",
                textUnderlineOffset: "2px",
                fontWeight: 500,
              }}
            >
              New post: {latestPost.title} ↗
            </a>
          )}
        </div>
        <h1
          className="text-[clamp(26px,4vw,44px)] font-bold leading-[1.18] tracking-[-0.025em] m-0"
          style={{ color: "var(--color-text)", textWrap: "balance" } as React.CSSProperties}
        >
          I build{" "}
          <span className="underline underline-offset-[4px]">small, useful things</span>{" "}
          — and write about what I learn along the way.
        </h1>
      </section>

      <SectionBar
        title="Projects"
        href="/projects"
        linkLabel="All projects →"
        spacing="lg"
      />
      <ProjectHomeGrid digital={digital} physical={physical} maxDigital={4} />

      <SectionBar
        title="Writing"
        href="/blog"
        linkLabel="All writing →"
        spacing="lg"
      />
      <div className="flex flex-col">
        {posts.map((post) => (
          <PostItem
            key={post.slug}
            date={post.date}
            title={post.title}
            href={post.external_url ?? `/blog/${post.slug}`}
            excerpt={post.excerpt}
            isExternal={!!post.external_url}
          />
        ))}
      </div>
    </PageContainer>
  );
}
