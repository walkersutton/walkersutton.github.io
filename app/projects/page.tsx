import projects from "@/data/projects.json";
import { ProjectRowList, type ProjectRowData } from "../components/ProjectRow";
import PageContainer from "../components/PageContainer";
import PageHero from "../components/PageHero";
import SectionBar from "../components/SectionBar";

export const metadata = { title: "Projects | Walker Sutton" };

export default function ProjectsPage() {
  const visible = projects.filter((p) => !p.hide) as ProjectRowData[];
  const digital = visible.filter((p) => p.category !== "physical");
  const physical = visible.filter((p) => p.category === "physical");

  return (
    <PageContainer>
      <PageHero eyebrow="Things I've made — software & in the shop">
        Projects.
      </PageHero>
      <SectionBar title="Everything" count={visible.length} />
      <ProjectRowList digital={digital} physical={physical} />
    </PageContainer>
  );
}
