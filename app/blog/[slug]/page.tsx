import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPostBySlug, getAllPosts } from "@/lib/posts";
import { MDXRemote } from "next-mdx-remote/rsc";

export async function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await props.params;
  const post = await getPostBySlug(slug);
  if (!post) return {};
  return { title: `${post.metadata.title} | Walker Sutton` };
}

function countWords(content: string) {
  return content
    .replace(/```[\s\S]*?```/g, "")
    .replace(/<[^>]+>/g, "")
    .split(/\s+/)
    .filter(Boolean).length;
}

export default async function PostPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const params = await props.params;
  const post = await getPostBySlug(params.slug);
  if (!post) notFound();

  const words = countWords(post.content);
  const readMin = Math.max(1, Math.round(words / 200));
  const formattedDate = new Date(
    post.metadata.date + "T12:00:00",
  ).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const stats = [
    { lbl: "Published", val: formattedDate },
    { lbl: "Read", val: `${readMin} min` },
    { lbl: "Words", val: words.toLocaleString() },
  ];

  return (
    <main>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "44px 28px 96px" }}>
        {/* Eyebrow */}
        <div
          className="text-[11px] font-semibold uppercase tracking-[0.13em]"
          style={{ color: "var(--color-text-faint)", marginBottom: 10 }}
        >
          Post
        </div>

        {/* Title */}
        <h1
          className="font-semibold leading-[1.08] tracking-[-0.025em]"
          style={
            {
              fontSize: "clamp(28px,4vw,42px)",
              color: "var(--color-text)",
              marginBottom: 14,
              textWrap: "balance",
            } as React.CSSProperties
          }
        >
          {post.metadata.title}.
        </h1>

        {/* Meta row */}
        <div
          className="flex items-center flex-wrap gap-4 text-[14px]"
          style={{ color: "var(--color-text-faint)" }}
        >
          <time dateTime={post.metadata.date}>{formattedDate}</time>
        </div>

        {/* Stats strip */}
        <div
          className="grid mt-8"
          style={{
            gridTemplateColumns: `repeat(${stats.length}, 1fr)`,
            borderTop: "1px solid var(--color-rule)",
            borderBottom: "1px solid var(--color-border-faint)",
          }}
        >
          {stats.map((s, i) => (
            <div
              key={s.lbl}
              style={{
                padding: "16px 0",
                borderLeft:
                  i === 0 ? "none" : "1px solid var(--color-border-faint)",
                paddingLeft: i === 0 ? 0 : 18,
              }}
            >
              <div
                className="text-[10px] font-semibold uppercase tracking-[0.13em] mb-[5px]"
                style={{ color: "var(--color-text-faint)" }}
              >
                {s.lbl}
              </div>
              <div
                className="text-[18px] font-semibold tracking-[-0.02em] leading-[1.1]"
                style={{ color: "var(--color-text)" }}
              >
                {s.val}
              </div>
            </div>
          ))}
        </div>

        {/* Prose */}
        <div
          className="prose max-w-none flex flex-col
            prose-h2:text-[11px] prose-h2:font-semibold prose-h2:uppercase prose-h2:tracking-[0.13em] prose-h2:mt-12 prose-h2:mb-3
            prose-h3:text-[23px] prose-h3:font-semibold prose-h3:tracking-[-0.02em] prose-h3:leading-[1.2] prose-h3:mt-10 prose-h3:mb-3
            prose-p:leading-[1.65] prose-p:mb-5
            prose-li:my-1
            prose-strong:font-semibold
            prose-a:no-underline prose-a:underline prose-a:underline-offset-[2px]
            prose-img:w-full prose-img:my-10
            prose-blockquote:border-l-2 prose-blockquote:pl-4 prose-blockquote:not-italic"
          style={
            {
              marginTop: 40,
              borderTop: "1px solid var(--color-border-faint)",
              paddingTop: 36,
              color: "var(--color-text-variant)",
              fontSize: 16,
              lineHeight: 1.65,
              "--tw-prose-body": "var(--color-text-variant)",
              "--tw-prose-headings": "var(--color-text)",
              "--tw-prose-links": "var(--color-text)",
              "--tw-prose-bold": "var(--color-text)",
              "--tw-prose-quotes": "var(--color-text-variant)",
              "--tw-prose-quote-borders": "var(--color-border)",
              "--tw-prose-captions": "var(--color-text-faint)",
              "--tw-prose-code": "var(--color-text)",
              "--tw-prose-pre-bg": "var(--color-bg-sink)",
              "--tw-prose-counters": "var(--color-text-faint)",
              "--tw-prose-bullets": "var(--color-text-faint)",
              "--tw-prose-hr": "var(--color-border)",
              "--tw-prose-th-borders": "var(--color-border)",
              "--tw-prose-td-borders": "var(--color-border-faint)",
            } as React.CSSProperties
          }
        >
          <MDXRemote source={post.content} />
        </div>
      </div>
    </main>
  );
}
