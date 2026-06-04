"use client";

import { useState } from "react";

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
  const [hov, setHov] = useState(false);
  const soon = project.href === "#";
  const imgSrc = project.still ?? project.image;

  return (
    <a
      href={soon ? undefined : project.href}
      target={soon ? undefined : "_blank"}
      rel={soon ? undefined : "noopener noreferrer"}
      className="block no-underline"
      style={{ color: "inherit", cursor: soon ? "default" : "pointer", textDecoration: "none" }}
      onMouseEnter={() => { if (!soon) setHov(true); }}
      onMouseLeave={() => setHov(false)}
    >
      <div
        style={{
          width: "100%",
          aspectRatio: "16/9",
          background: "var(--color-bg-sink)",
          border: "1px solid var(--color-text)",
          overflow: "hidden",
          position: "relative",
          boxShadow: hov ? "1px 1px 0 0 var(--color-text)" : "3px 3px 0 0 var(--color-text)",
          transform: hov ? "translate(2px, 2px)" : "none",
          transition: "box-shadow 0.1s ease, transform 0.1s ease",
          marginBottom: 10,
        }}
      >
        {imgSrc && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imgSrc}
            alt={project.name}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
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
      </div>
      <div className="flex flex-col gap-[3px]">
        <span
          style={{
            fontSize: 16,
            fontWeight: 700,
            letterSpacing: "-0.015em",
            color: soon ? "var(--color-text-faint)" : "var(--color-text)",
            textDecoration: hov ? "underline" : "none",
            textUnderlineOffset: 2,
          }}
        >
          {project.name}
        </span>
        <span style={{ fontSize: 13, color: "var(--color-text-variant)", lineHeight: 1.4 }}>
          {project.blurb}
        </span>
      </div>
    </a>
  );
}

function PhysRow({ project }: { project: ProjectRowData }) {
  const [hov, setHov] = useState(false);
  const soon = project.href === "#";

  return (
    <a
      href={soon ? undefined : project.href}
      target={soon ? undefined : "_blank"}
      rel={soon ? undefined : "noopener noreferrer"}
      className="no-underline flex items-baseline justify-between gap-5 py-[12px]"
      style={{
        borderBottom: "1px solid var(--color-border-faint)",
        color: "inherit",
        cursor: soon ? "default" : "pointer",
        textDecoration: "none",
      }}
      onMouseEnter={() => { if (!soon) setHov(true); }}
      onMouseLeave={() => setHov(false)}
    >
      <span
        style={{
          fontSize: 17,
          fontWeight: 700,
          letterSpacing: "-0.015em",
          color: soon ? "var(--color-text-faint)" : "var(--color-text)",
          textDecoration: hov ? "underline" : "none",
          textUnderlineOffset: 2,
        }}
      >
        {project.name}
      </span>
      <span style={{ fontSize: 13, color: "var(--color-text-variant)" }}>
        {project.blurb}
      </span>
    </a>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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
