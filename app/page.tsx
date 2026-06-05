import type React from "react";
import projects from "@/data/projects.json";
import { getAllPosts, getPostBySlug, generateExcerpt } from "@/lib/posts";
import { ProjectHomeGrid, type ProjectRowData } from "./components/ProjectRow";
import PostItem from "./components/PostItem";
import PageContainer from "./components/PageContainer";
import SectionBar from "./components/SectionBar";
import { getLatestOverride } from "@/lib/live-state";

export default async function Home() {
  const visible = projects.filter((p) => !p.hide) as ProjectRowData[];

  const postsMetadata = getAllPosts().slice(0, 4);
  const posts = await Promise.all(
    postsMetadata.map(async (meta) => {
      const full = await getPostBySlug(meta.slug);
      const excerpt = generateExcerpt(full?.content ?? "", { length: 140 });
      return { ...meta, excerpt };
    }),
  );

  const latestPost = posts[0];
  const latestOverride = await getLatestOverride();

  const latestText = latestOverride?.text ?? (latestPost ? latestPost.title : null);
  const latestHref = latestOverride?.href ?? (latestPost ? (latestPost.external_url ?? `/blog/${latestPost.slug}`) : null);
  const isExternal = latestOverride ? !latestOverride.href.startsWith("/") : !!latestPost?.external_url;

  return (
    <PageContainer>
      {/* Hero */}
      <section className="pt-12 pb-4 max-w-[820px]">
        <div
          className="flex flex-wrap gap-4 text-[13px] font-medium mb-5"
          style={{ color: "var(--color-text-variant)" }}
        >
          {latestText && latestHref && (
            <a
              href={latestHref}
              target={isExternal ? "_blank" : undefined}
              rel={isExternal ? "noopener noreferrer" : undefined}
              className="border-animate"
              style={{
                color: "var(--color-text-variant)",
                textDecoration: "none",
                fontWeight: 500,
              }}
            >
              <span className="b b-bottom" />
              <span className="b b-right" />
              <span className="b b-top" />
              <span className="b b-left" />
              the latest: {latestText} ↗
            </a>
          )}
        </div>
        <h1
          className="text-[clamp(26px,4vw,44px)] font-bold leading-[1.18] tracking-[-0.025em] m-0"
          style={
            {
              color: "var(--color-text)",
              textWrap: "balance",
            } as React.CSSProperties
          }
        >
          I build{" "}
          <span className="underline underline-offset-[4px]">
            small, useful things
          </span>{" "}
          — and write about what I learn along the way.
        </h1>
      </section>

      <SectionBar
        title="Projects"
        href="/projects"
        linkLabel="All projects →"
        spacing="lg"
      />
      <ProjectHomeGrid projects={visible} maxProjects={4} />

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
