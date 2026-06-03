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
    <article className="w-full max-w-[680px] mx-auto pt-12 pb-2">
      <header className="flex flex-col gap-2 mb-8">
        <h1
          className="text-[clamp(32px,5vw,52px)] font-bold leading-[1.06] tracking-[-0.03em] m-0"
          style={{ color: "var(--color-text)", textWrap: "balance" } as React.CSSProperties}
        >
          {post.metadata.title}
        </h1>
        <div
          className="text-[14px] pb-6 mb-2"
          style={{
            color: "var(--color-text-faint)",
            borderBottom: "1px solid var(--color-border)",
          }}
        >
          <time dateTime={post.metadata.date}>
            {new Date(post.metadata.date).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </time>
        </div>
      </header>

      <div
        className="prose prose-lg max-w-none
          prose-headings:font-display prose-headings:font-bold
          prose-h2:text-[13px] prose-h2:uppercase prose-h2:tracking-[0.13em] prose-h2:mt-10 prose-h2:mb-3.5
          prose-h3:text-[24px] prose-h3:tracking-[-0.02em] prose-h3:mt-9 prose-h3:mb-3
          prose-p:leading-[1.75] prose-p:mb-5
          prose-li:my-1
          prose-a:text-[var(--accent)] prose-a:no-underline prose-a:hover:underline
          prose-img:rounded-sm prose-img:w-full prose-img:my-10
          prose-blockquote:border-l-[var(--color-text-faint)] prose-blockquote:text-[var(--color-text-variant)]"
        style={{
          color: "var(--color-text)",
          fontSize: "17.5px",
          lineHeight: "1.75",
        }}
      >
        <MDXRemote source={post.content} />
      </div>
    </article>
  );
}
