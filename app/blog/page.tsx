import { getAllPosts, getPostBySlug, generateExcerpt } from "@/lib/posts";
import PostItem from "../components/PostItem";
import Container from "../components/Container";
import { SITE_CONFIG } from "@/lib/config";

export const metadata = {
  title: `Blog | ${SITE_CONFIG.title}`,
  description: "A collection of blog posts and articles.",
};

export default async function BlogPage() {
  const postsMetadata = getAllPosts();
  const posts = await Promise.all(
    postsMetadata.map(async (meta) => {
      const fullPost = await getPostBySlug(meta.slug);
      const excerpt = generateExcerpt(fullPost?.content || "");
      return { ...meta, excerpt };
    }),
  );

  return (
    <Container>
      <div className="flex flex-col gap-12">
        <div className="flex flex-col gap-6">
          {posts.map((post) => {
            return (
              <PostItem
                key={post.slug}
                date={post.date}
                title={post.title}
                href={post.external_url || `/blog/${post.slug}`}
                excerpt={post.excerpt}
                isExternal={!!post.external_url}
              />
            );
          })}
        </div>
      </div>
    </Container>
  );
}
