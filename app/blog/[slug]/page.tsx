import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getPostBySlug, getAllPosts } from "@/lib/posts";
import ContentPageLayout from "@/app/components/ContentPageLayout";

export async function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await props.params;
  const post = await getPostBySlug(slug);
  if (!post) return {};
  return { title: `${post.metadata.title} | Walker Sutton` };
}

export default async function PostPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const formattedDate = new Date(
    post.metadata.date + "T12:00:00",
  ).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const eyebrow = (
    <>
      <Link href="/blog" style={{ color: "inherit", textDecoration: "none" }}>
        Blog
      </Link>
      {" / "}
      {slug}
    </>
  );

  const meta = (
    <div
      className="flex flex-wrap gap-x-6 gap-y-2 mt-8 pt-6 text-[13px]"
      style={{
        borderTop: "1px solid var(--color-rule)",
        color: "var(--color-text-faint)",
      }}
    >
      <span>
        <span className="font-semibold uppercase tracking-[0.1em] text-[10px] mr-2">Published</span>
        <time dateTime={post.metadata.date}>{formattedDate}</time>
      </span>
    </div>
  );

  return (
    <ContentPageLayout eyebrow={eyebrow} title={post.metadata.title} content={post.content}>
      {meta}
    </ContentPageLayout>
  );
}
