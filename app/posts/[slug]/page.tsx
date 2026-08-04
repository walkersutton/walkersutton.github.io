import type { Metadata } from "next";
import { draftMode } from "next/headers";
import { notFound } from "next/navigation";
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

  const { isEnabled: showDrafts } = await draftMode();
  if (post.metadata.draft && !showDrafts) notFound();

  const formattedDate = new Date(
    post.metadata.date + "T12:00:00",
  ).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const meta = (
    <div
      className="text-[12px] font-semibold uppercase tracking-[0.11em]"
      style={{ color: "var(--color-text-variant)" }}
    >
      <time dateTime={post.metadata.date}>{formattedDate}</time>
    </div>
  );

  return (
    <ContentPageLayout title={post.metadata.title} content={post.content}>
      {meta}
    </ContentPageLayout>
  );
}
