"use client";

import { useState } from "react";
import CardImageBox from "./CardImageBox";

export interface ProjectRowData {
  name: string;
  year?: string;
  href: string;
  blurb: string;
  image?: string;
  still?: string;
}

function ProjectCardItem({ project }: { project: ProjectRowData }) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  const soon = project.href === "#";
  // const soon = true;
  const imgSrc =
    hovered && project.image
      ? project.image
      : (project.still ?? project.image);
  const linkProps = soon
    ? { href: undefined as unknown as string }
    : { href: project.href, target: "_blank", rel: "noopener noreferrer" };

  const handlers = soon ? {} : {
    onMouseEnter: () => setHovered(true),
    onMouseLeave: () => { setHovered(false); setPressed(false); },
    onMouseDown: () => setPressed(true),
    onMouseUp: () => setPressed(false),
  };

  const imageBoxStyle: React.CSSProperties = soon ? {} : pressed
    ? { boxShadow: "none", transform: "translate(5px, 5px)" }
    : hovered
    ? { boxShadow: "3px 3px 0 0 var(--color-text)", transform: "translate(2px, 2px)" }
    : {};

  return (
    <div className="block break-inside-avoid mb-5">
      {imgSrc && (
        <a
          {...linkProps}
          {...handlers}
          className="block"
          style={{
            cursor: soon ? "default" : "pointer",
            textDecoration: "none",
            marginBottom: 10,
          }}
        >
          <CardImageBox style={imageBoxStyle}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imgSrc}
              alt={project.name}
              style={{
                width: "100%",
                height: "auto",
                display: "block",
              }}
            />
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
          </CardImageBox>
        </a>
      )}
      <div className="flex flex-col gap-[3px]">
        <a
          {...linkProps}
          {...handlers}
          style={{
            fontSize: 16,
            fontWeight: 700,
            letterSpacing: "-0.015em",
            color: soon ? "var(--color-text-faint)" : "var(--color-text)",
            textDecoration: hovered && !soon ? "underline" : "none",
            textUnderlineOffset: "2px",
            cursor: soon ? "default" : "pointer",
            width: "fit-content",
          }}
        >
          {project.name}
        </a>
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
