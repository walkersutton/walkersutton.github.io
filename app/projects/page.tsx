import projects from "@/data/projects.json";
import { ProjectHomeGrid, type ProjectRowData } from "../components/ProjectRow";
import PageContainer from "../components/PageContainer";

export const metadata = { title: "Projects | Walker Sutton" };

export default function ProjectsPage() {
  const visible = projects.filter((p) => !p.hide) as ProjectRowData[];

  return (
    <PageContainer>
      {/* <SectionBar title="Projects" spacing="lg" /> */}
      <ProjectHomeGrid projects={visible} />
    </PageContainer>
  );
}
