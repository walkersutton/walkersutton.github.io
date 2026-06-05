"use client";

import { useState } from "react";
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
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  const soon = !project.slug && project.href === "#";
  // const soon = true;
  const imgSrc =
    hovered && project.image
      ? project.image
      : (project.still ?? project.image);
  const internalHref = project.slug ? `/projects/${project.slug}` : null;
  const externalHref = !project.slug && project.href && project.href !== "#" ? project.href : null;

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

  const baseLinkStyle = {
    cursor: soon ? "default" : "pointer",
    textDecoration: "none",
  } as React.CSSProperties;

  const link = (children: React.ReactNode, style?: React.CSSProperties, className?: string) => {
    const s = { ...baseLinkStyle, ...style };
    if (soon) return <span className={className} style={s}>{children}</span>;
    if (internalHref) return <Link href={internalHref} className={className} style={s} {...handlers}>{children}</Link>;
    return <a href={externalHref!} target="_blank" rel="noopener noreferrer" className={className} style={s} {...handlers}>{children}</a>;
  };

  return (
    <div className="block break-inside-avoid mb-5">
      {imgSrc && link(
        <CardImageBox style={imageBoxStyle}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imgSrc}
            alt={project.name}
            style={{ width: "100%", height: "auto", display: "block" }}
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
        </CardImageBox>,
        { marginBottom: 10 },
        "block",
      )}
      <div className="flex flex-col gap-[3px]">
        {link(
          project.name,
          {
            fontSize: 16,
            fontWeight: 700,
            letterSpacing: "-0.015em",
            color: soon ? "var(--color-text-faint)" : "var(--color-text)",
            textDecoration: hovered && !soon ? "underline" : "none",
            textUnderlineOffset: "2px",
            width: "fit-content",
          },
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
