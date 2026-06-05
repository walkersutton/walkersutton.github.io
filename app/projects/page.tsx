import { getAllProjects } from "@/lib/projects";
import { ProjectHomeGrid, type ProjectRowData } from "../components/ProjectRow";
import PageContainer from "../components/PageContainer";

export const metadata = { title: "Projects | Walker Sutton" };

export default function ProjectsPage() {
  const visible = getAllProjects().filter((p) => !p.hide) as ProjectRowData[];

  return (
    <PageContainer>
      <ProjectHomeGrid projects={visible} />
    </PageContainer>
  );
}
