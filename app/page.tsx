import Section from "./components/Section";
import activeProjects from "@/data/activeProjects.json";
import dormantProjects from "@/data/dormantProjects.json";
import { recentPosts } from "@/data/recentPosts";

export default async function Home() {
  const posts = await recentPosts();
  return (
    <main className="flex flex-col gap-20">
      <Section title="Active Projects" elements={activeProjects} />
      {posts && <Section title="Writing" elements={posts} />}
      <Section title="Dormant Projects" elements={dormantProjects} />
    </main>
  );
}
