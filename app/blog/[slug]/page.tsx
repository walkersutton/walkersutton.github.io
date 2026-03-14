import { notFound } from "next/navigation";
import { getPostBySlug, getAllPosts } from "@/lib/posts";
import { MDXRemote } from "next-mdx-remote/rsc";
import ThickBorder from "@/app/components/ThickBorder";
import Container from "@/app/components/Container";

export async function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export default async function PostPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const params = await props.params;
  const post = await getPostBySlug(params.slug);

  if (!post) {
    notFound();
  }

  return (
    <Container as="article" className="py-0 md:py-4 lg:py-8">
      <header className="flex flex-col gap-2 mb-6">
        <h1 className="font-display text-3xl md:text-5xl lg:text-6xl text-[var(--color-text)] leading-[1.1] font-bold">
          {post.metadata.title}
        </h1>
        <div className="text-[var(--color-text-variant)] text-md flex items-center gap-2">
          <time dateTime={post.metadata.date}>
            {new Date(post.metadata.date).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </time>
        </div>
        <ThickBorder className="mt-2" />
      </header>

      <div
        className="prose prose-lg prose-neutral dark:prose-invert max-w-none 
        prose-headings:font-display prose-headings:font-bold prose-headings:text-[var(--color-text)]
        prose-h2:mt-8 prose-h2:mb-4
        prose-li:my-0.5 
        prose-li:marker:text-[var(--color-text)]
        prose-li:text-[var(--color-text)]
        prose-blockquote:text-[var(--color-text-variant)] prose-blockquote:border-l-[var(--color-text-variant)]
        prose-em:text-[var(--color-text-variant)]
        prose-p:text-[var(--color-text)] prose-p:leading-relaxed
        prose-a:text-[var(--accent)] prose-a:no-underline prose-a:hover:underline
        prose-img:rounded-sm prose-img:w-full prose-img:my-12"
      >
        <MDXRemote source={post.content} />
      </div>
    </Container>
  );
}
