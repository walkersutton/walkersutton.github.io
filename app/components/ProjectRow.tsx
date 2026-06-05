import type React from "react";
import Link from "next/link";
import CardImageBox from "./CardImageBox";

export interface ProjectRowData {
  name: string;
  slug?: string;
  year?: string;
  href?: string;
  blurb: string;
  image?: string;
  still?: string;
}

function ProjectCardItem({ project }: { project: ProjectRowData }) {
  const soon = !project.slug && project.href === "#";
  const stillSrc = project.still ?? project.image;
  const hasHoverImage =
    Boolean(project.still) &&
    Boolean(project.image) &&
    project.still !== project.image;
  const internalHref = project.slug ? `/projects/${project.slug}` : null;
  const externalHref =
    !project.slug && project.href && project.href !== "#" ? project.href : null;

  const baseLinkStyle = {
    cursor: soon ? "default" : "pointer",
  } as React.CSSProperties;

  const link = (
    children: React.ReactNode,
    style?: React.CSSProperties,
    className?: string,
  ) => {
    const s = { ...baseLinkStyle, ...style };
    if (soon)
      return (
        <span className={className} style={s}>
          {children}
        </span>
      );
    if (internalHref)
      return (
        <Link href={internalHref} className={className} style={s}>
          {children}
        </Link>
      );
    return (
      <a
        href={externalHref!}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        style={s}
      >
        {children}
      </a>
    );
  };

  return (
    <div className="project-card block break-inside-avoid mb-5">
      {stillSrc &&
        link(
          <CardImageBox>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={stillSrc}
              alt={project.name}
              style={{ width: "100%", height: "auto", display: "block" }}
            />
            {hasHoverImage && (
              // Keep the GIF mounted so hover only changes presentation, not src.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={project.image}
                alt=""
                aria-hidden="true"
                loading="lazy"
                decoding="async"
                fetchPriority="low"
                className="project-card-gif"
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                  pointerEvents: "none",
                }}
              />
            )}
            {soon && (
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  background: "var(--color-text)",
                  color: "var(--color-bg)",
                  fontSize: 10,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  padding: "6px 10px",
                  textAlign: "center",
                }}
              >
                In progress
              </div>
            )}
          </CardImageBox>,
          { marginBottom: 10, textDecoration: "none" },
          "project-card-trigger card-link block",
        )}
      <div className="flex flex-col gap-[3px]">
        {link(
          project.name,
          {
            fontSize: 16,
            fontWeight: 700,
            letterSpacing: "-0.015em",
            color: soon ? "var(--color-text-faint)" : "var(--color-text)",
            textUnderlineOffset: "2px",
            width: "fit-content",
          },
          soon ? undefined : "project-card-trigger project-card-title",
        )}
        <span
          style={{
            fontSize: 13,
            color: "var(--color-text-variant)",
            lineHeight: 1.4,
          }}
        >
          {project.blurb}
        </span>
      </div>
    </div>
  );
}

export function ProjectHomeGrid({
  projects,
  maxProjects,
}: {
  projects: ProjectRowData[];
  maxProjects?: number;
}) {
  const displayedProjects = maxProjects
    ? projects.slice(0, maxProjects)
    : projects;

  return (
    <div className="columns-1 sm:columns-2 gap-x-5">
      {displayedProjects.map((project) => (
        <ProjectCardItem key={project.name} project={project} />
      ))}
    </div>
  );
}
