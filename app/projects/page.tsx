import { draftMode } from "next/headers";
import { getAllProjects } from "@/lib/projects";
import { ProjectHomeGrid, type ProjectRowData } from "../components/ProjectRow";
import PageContainer from "../components/PageContainer";

export const metadata = { title: "Projects | Walker Sutton" };

export default async function ProjectsPage() {
  const { isEnabled: includeDrafts } = await draftMode();
  const visible = (getAllProjects({ includeDrafts }) as ProjectRowData[]).sort(
    (a, b) => new Date(b.date ?? 0).getTime() - new Date(a.date ?? 0).getTime()
  );

  return (
    <PageContainer>
      <ProjectHomeGrid projects={visible} />
    </PageContainer>
  );
}
