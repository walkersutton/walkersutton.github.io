import { draftMode } from "next/headers";
import { getAllPosts, getPostBySlug, generateExcerpt } from "@/lib/posts";
import PostItem from "../components/PostItem";
import PageContainer from "../components/PageContainer";
import { SITE_CONFIG } from "@/lib/config";

export const metadata = {
  title: `Posts | ${SITE_CONFIG.title}`,
  description: "A collection of written posts.",
};

export default async function PostsPage() {
  const { isEnabled: includeDrafts } = await draftMode();
  const postsMetadata = getAllPosts({ includeDrafts });
  const posts = await Promise.all(
    postsMetadata.map(async (meta) => {
      const fullPost = await getPostBySlug(meta.slug);
      const excerpt = generateExcerpt(fullPost?.content ?? "", { length: 140 });
      return { ...meta, excerpt };
    }),
  );

  return (
    <PageContainer>
      {/* <PageHero eyebrow="Notes from the workbench">Writing.</PageHero> */}
      <div className="flex flex-col">
        {posts.map((post) => (
          <PostItem
            key={post.slug}
            date={post.date}
            title={post.title}
            href={post.external_url ?? `/posts/${post.slug}`}
            excerpt={post.excerpt}
            isExternal={!!post.external_url}
          />
        ))}
      </div>
    </PageContainer>
  );
}
