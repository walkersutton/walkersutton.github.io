import type React from "react";
import projects from "@/data/projects.json";
import { getAllPosts, getPostBySlug, generateExcerpt } from "@/lib/posts";
import { ProjectRowList, type ProjectRowData } from "./components/ProjectRow";
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

  return (
    <PageContainer>
      {/* Hero — custom layout with green dot + meta row */}
      <section className="pt-14 pb-4 max-w-[800px]">
        <div
          className="flex flex-wrap gap-4 text-[13.5px] font-medium mb-6"
          style={{ color: "var(--color-text-variant)" }}
        >
          <span
            className="inline-flex items-center gap-1.5"
            style={{ color: "var(--color-text)" }}
          >
            <span
              className="status-dot w-[7px] h-[7px] rounded-full shrink-0"
              style={{ background: "#3bb56a" }}
            />
            Available for projects
          </span>
          <span>Maker &amp; engineer</span>
          <span>New York</span>
        </div>
        <h1
          className="text-[clamp(28px,4.4vw,47px)] font-semibold leading-[1.16] tracking-[-0.025em] m-0"
          style={{ color: "var(--color-text)", textWrap: "balance" } as React.CSSProperties}
        >
          I build{" "}
          <span
            className="underline decoration-4 underline-offset-[5px]"
            style={{ textDecorationColor: "var(--accent)" }}
          >
            small, useful things
          </span>{" "}
          — and write about what I learn along the way.
        </h1>
      </section>

      <SectionBar
        title="Projects"
        count={visible.length}
        href="/projects"
        linkLabel="All projects →"
        spacing="lg"
      />
      <ProjectRowList digital={digital} physical={physical} maxDigital={4} />

      <SectionBar
        title="Writing"
        count={postsMetadata.length}
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
