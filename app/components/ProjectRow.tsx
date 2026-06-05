"use client";

import { useState } from "react";
import CardImageBox from "./CardImageBox";

export interface ProjectRowData {
  name: string;
  year?: string;
  category?: "digital" | "physical";
  href: string;
  blurb: string;
  image?: string;
  still?: string;
}

function SubLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 mt-7 mb-0.5">
      <span
        className="text-[12px] font-semibold uppercase tracking-[0.14em]"
        style={{ color: "var(--color-text-faint)" }}
      >
        {children}
      </span>
      <span
        className="flex-1 h-px"
        style={{ background: "var(--color-border-faint)" }}
      />
    </div>
  );
}

function ProjectCardItem({ project }: { project: ProjectRowData }) {
  const [hovered, setHovered] = useState(false);
  const soon = project.href === "#";
  // const soon = true;
  const imgSrc = hovered && project.image ? project.image : (project.still ?? project.image);
  const linkProps = soon
    ? { href: undefined as unknown as string }
    : { href: project.href, target: "_blank", rel: "noopener noreferrer" };

  return (
    <div className="block">
      <a
        {...linkProps}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={soon ? "block" : "block card-link"}
        style={{
          cursor: soon ? "default" : "pointer",
          textDecoration: "none",
          marginBottom: 10,
        }}
      >
        <CardImageBox>
          {imgSrc && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imgSrc}
              alt={project.name}
              style={{
                width: "100%",
                height: "auto",
                display: "block",
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
        </CardImageBox>
      </a>
      <div className="flex flex-col gap-[3px]">
        <a
          {...linkProps}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
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

function PhysRow({ project }: { project: ProjectRowData }) {
  const soon = project.href === "#";
  const linkProps = soon
    ? { href: undefined as unknown as string }
    : { href: project.href, target: "_blank", rel: "noopener noreferrer" };

  return (
    <div
      className="flex items-baseline justify-between gap-5 py-[12px]"
      style={{ borderBottom: "1px solid var(--color-border-faint)" }}
    >
      <a
        {...linkProps}
        className={soon ? "" : "hover:underline underline-offset-[2px]"}
        style={{
          fontSize: 17,
          fontWeight: 700,
          letterSpacing: "-0.015em",
          color: soon ? "var(--color-text-faint)" : "var(--color-text)",
          textDecoration: "none",
          cursor: soon ? "default" : "pointer",
          width: "fit-content",
        }}
      >
        {project.name}
      </a>
      <span style={{ fontSize: 13, color: "var(--color-text-variant)" }}>
        {project.blurb}
      </span>
    </div>
  );
}

export function ProjectHomeGrid({
  digital,
  physical,
  maxDigital,
}: {
  digital: ProjectRowData[];
  physical: ProjectRowData[];
  maxDigital?: number;
}) {
  const displayDigital = maxDigital ? digital.slice(0, maxDigital) : digital;

  return (
    <>
      {digital.length > 0 && (
        <>
          <SubLabel>Digital</SubLabel>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-start">
            {displayDigital.map((p) => (
              <ProjectCardItem key={p.name} project={p} />
            ))}
          </div>
        </>
      )}
      {physical.length > 0 && (
        <>
          <SubLabel>Physical</SubLabel>
          <div>
            {physical.map((p) => (
              <PhysRow key={p.name} project={p} />
            ))}
          </div>
        </>
      )}
    </>
  );
}
