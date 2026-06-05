import projects from "@/data/projects.json";
import { ProjectHomeGrid, type ProjectRowData } from "../components/ProjectRow";
import PageContainer from "../components/PageContainer";

export const metadata = { title: "Projects | Walker Sutton" };

export default function ProjectsPage() {
  const visible = projects.filter((p) => !p.hide) as ProjectRowData[];
  const digital = visible.filter((p) => p.category !== "physical");
  const physical = visible.filter((p) => p.category === "physical");

  return (
    <PageContainer>
      {/* <SectionBar title="Projects" spacing="lg" /> */}
      <ProjectHomeGrid digital={digital} physical={physical} />
    </PageContainer>
  );
}
