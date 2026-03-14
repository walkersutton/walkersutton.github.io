import projects from "@/data/projects.json";
import ProjectCard, { Project } from "../components/ProjectCard";

export default function ProjectsPage() {
  return (
    <main className="flex flex-col">
      <section className="flex flex-col">
        <div className="columns-1 md:columns-2 gap-4 space-y-4">
          {projects.filter((project) => !project.hide).map((project, index) => (
            <div key={index} className="break-inside-avoid">
              <ProjectCard project={project as Project} />
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
