import projects from "@/data/projects.json";
import { getAllPosts, getPostBySlug, generateExcerpt } from "@/lib/posts";
import ProjectCard, { Project } from "./components/ProjectCard";
import PostItem from "./components/PostItem";
import SectionHeading from "./components/SectionHeading";
import Container from "./components/Container";

export default async function Home() {
  const featuredProjects = projects
    .filter((project) => !project.hide)
    .slice(0, 4);

  const latestPostsMetadata = getAllPosts().slice(0, 3);
  const latestPosts = await Promise.all(
    latestPostsMetadata.map(async (meta) => {
      const fullPost = await getPostBySlug(meta.slug);
      const excerpt = generateExcerpt(fullPost?.content || "", { preserveNewlines: true });
      return { ...meta, excerpt };
    }),
  );

  return (
    <Container className="gap-8">
      {/* Projects — 2x2 grid */}
      <section>
        <SectionHeading href="/projects">Projects</SectionHeading>
        <div className="columns-1 md:columns-2 gap-3 space-y-3">
          {featuredProjects.map((project, i) => (
            <div key={i} className="break-inside-avoid">
              <ProjectCard project={project as Project} />
            </div>
          ))}
        </div>
      </section>

      {/* Writing */}
      <section>
        <SectionHeading href="/blog">Blog</SectionHeading>
        <div className="flex flex-col gap-8">
          {latestPosts.map((post, i) => (
            <PostItem
              key={i}
              title={post.title}
              href={post.external_url || `/blog/${post.slug}`}
              excerpt={post.excerpt}
              isExternal={!!post.external_url}
            />
          ))}
        </div>
      </section>
    </Container>
  );
}
