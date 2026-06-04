import { notFound } from "next/navigation";
import { getPostBySlug, getAllPosts } from "@/lib/posts";
import { MDXRemote } from "next-mdx-remote/rsc";

export async function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export default async function PostPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const params = await props.params;
  const post = await getPostBySlug(params.slug);

  if (!post) notFound();

  return (
    <article className="w-full max-w-[680px] mx-auto pt-12 pb-16">
      <header className="mb-10">
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(28px,4.4vw,47px)",
            fontWeight: 600,
            lineHeight: 1.16,
            letterSpacing: "-0.025em",
            color: "var(--color-text)",
            textWrap: "balance",
            margin: "0 0 16px",
          } as React.CSSProperties}
        >
          {post.metadata.title}
        </h1>
        <div
          style={{
            borderBottom: "1px solid var(--color-border)",
            paddingBottom: 18,
          }}
        >
          <time
            dateTime={post.metadata.date}
            style={{
              fontSize: 11,
              fontWeight: 500,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "var(--color-text-faint)",
            }}
          >
            {new Date(post.metadata.date + "T12:00:00").toLocaleDateString(
              "en-US",
              { year: "numeric", month: "short", day: "numeric" },
            )}
          </time>
        </div>
      </header>

      <div
        className="prose max-w-none
          prose-h2:text-[11px] prose-h2:font-semibold prose-h2:uppercase prose-h2:tracking-[0.13em] prose-h2:mt-12 prose-h2:mb-3
          prose-h3:text-[23px] prose-h3:font-semibold prose-h3:tracking-[-0.02em] prose-h3:leading-[1.2] prose-h3:mt-10 prose-h3:mb-3
          prose-p:leading-[1.65] prose-p:mb-5
          prose-li:my-1
          prose-strong:font-semibold
          prose-a:no-underline prose-a:underline prose-a:underline-offset-[2px]
          prose-img:w-full prose-img:my-10
          prose-blockquote:border-l-2 prose-blockquote:pl-4 prose-blockquote:not-italic"
        style={{
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
          "--tw-prose-invert-body": "var(--color-text-variant)",
          "--tw-prose-invert-headings": "var(--color-text)",
          "--tw-prose-invert-links": "var(--color-text)",
        } as React.CSSProperties}
      >
        <MDXRemote source={post.content} />
      </div>
    </article>
  );
}
