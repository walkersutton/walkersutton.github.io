import { getAllPosts, getPostBySlug, generateExcerpt } from "@/lib/posts";
import PostItem from "../components/PostItem";
import PageContainer from "../components/PageContainer";
import PageHero from "../components/PageHero";
import SectionBar from "../components/SectionBar";
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
      const excerpt = generateExcerpt(fullPost?.content ?? "", { length: 140 });
      return { ...meta, excerpt };
    }),
  );

  return (
    <PageContainer>
      <PageHero eyebrow="Notes from the workbench">Writing.</PageHero>
      {/* <SectionBar title="All posts" /> */}
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
