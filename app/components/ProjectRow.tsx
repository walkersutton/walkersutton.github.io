"use client";

import { useState, useCallback } from "react";

export interface ProjectRowData {
  name: string;
  year?: string;
  category?: "digital" | "physical";
  href: string;
  blurb: string;
  image?: string;
  still?: string;
}

interface HoverState {
  show: boolean;
  src: string;
  name: string;
  cat: string;
  x: number;
  y: number;
}

function HoverPreview({ state }: { state: HoverState }) {
  const off = 24;
  const flipX =
    typeof window !== "undefined" && state.x > window.innerWidth - 360;

  return (
    <div
      className="fixed z-50 pointer-events-none w-80 rounded-2xl overflow-hidden"
      style={{
        left: flipX ? state.x - 320 - off : state.x + off,
        top: Math.min(
          state.y + off,
          (typeof window !== "undefined" ? window.innerHeight : 800) - 270
        ),
        background: "var(--color-bg-paper)",
        border: "1px solid var(--color-border)",
        boxShadow: "0 22px 60px rgba(15, 12, 6, 0.26)",
        opacity: state.show ? 1 : 0,
        transform: state.show
          ? "translateY(0) scale(1)"
          : "translateY(8px) scale(0.97)",
        transition: "opacity 0.15s cubic-bezier(0.23, 1, 0.32, 1), transform 0.15s cubic-bezier(0.23, 1, 0.32, 1)",
      }}
    >
      {state.src && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={state.src}
          alt=""
          className="block w-full object-cover"
          style={{ height: 210, background: "var(--color-bg-sink)" }}
        />
      )}
      <div
        className="flex justify-between items-center px-3.5 py-3 text-[12.5px] font-semibold"
        style={{ color: "var(--color-text)" }}
      >
        <span>{state.name}</span>
        <span
          className="font-medium uppercase tracking-[0.08em] text-[11px]"
          style={{ color: "var(--color-text-faint)" }}
        >
          {state.cat}
        </span>
      </div>
    </div>
  );
}

function ProjectRow({
  project,
  onEnter,
  onMove,
  onLeave,
}: {
  project: ProjectRowData;
  onEnter: (
    src: string,
    name: string,
    cat: string,
    e: React.MouseEvent
  ) => void;
  onMove: (e: React.MouseEvent) => void;
  onLeave: () => void;
}) {
  const soon = project.href === "#";

  return (
    <div className="project-row">
      {/* Year */}
      <span
        className="text-[14px] tabular-nums"
        style={{ color: "var(--color-text-faint)" }}
      >
        {project.year ?? ""}
      </span>

      {/* Middle column: name (link) + blurb (plain text) */}
      <span className="flex items-baseline gap-3.5 flex-wrap min-w-0">
        {soon ? (
          <span
            className="row-name text-[20px] font-semibold tracking-[-0.018em]"
            style={{ color: "var(--color-text-faint)" }}
          >
            {project.name}
          </span>
        ) : (
          <a
            href={project.href}
            target="_blank"
            rel="noopener noreferrer"
            className="row-name text-[20px] font-semibold tracking-[-0.018em] no-underline"
            style={{ color: "var(--color-text)" }}
            onMouseEnter={(e) =>
              onEnter(
                project.image ?? project.still ?? "",
                project.name,
                project.category ?? "",
                e
              )
            }
            onMouseMove={onMove}
            onMouseLeave={onLeave}
          >
            {project.name}
          </a>
        )}
        <span
          className="text-[15px]"
          style={{ color: soon ? "var(--color-text-faint)" : "var(--color-text-variant)" }}
        >
          {project.blurb}
        </span>
        {soon && (
          <span
            className="text-[12px] font-medium uppercase tracking-[0.09em]"
            style={{ color: "var(--accent)" }}
          >
            In progress
          </span>
        )}
      </span>

      {/* Right — reserved for optional GitHub / blog links */}
      <span className="row-right flex items-center gap-3 whitespace-nowrap" />
    </div>
  );
}

function SubLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 mt-7 mb-0.5">
      <span
        className="text-[12px] font-semibold uppercase tracking-[0.14em]"
        style={{ color: "var(--color-text-variant)" }}
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

export function ProjectRowList({
  digital,
  physical,
  maxDigital,
}: {
  digital: ProjectRowData[];
  physical: ProjectRowData[];
  maxDigital?: number;
}) {
  const [hover, setHover] = useState<HoverState>({
    show: false,
    src: "",
    name: "",
    cat: "",
    x: 0,
    y: 0,
  });

  const onEnter = useCallback(
    (src: string, name: string, cat: string, e: React.MouseEvent) => {
      if (!src) return;
      setHover({ show: true, src, name, cat, x: e.clientX, y: e.clientY });
    },
    []
  );

  const onMove = useCallback((e: React.MouseEvent) => {
    setHover((h) => (h.show ? { ...h, x: e.clientX, y: e.clientY } : h));
  }, []);

  const onLeave = useCallback(() => {
    setHover((h) => ({ ...h, show: false }));
  }, []);

  const displayDigital = maxDigital ? digital.slice(0, maxDigital) : digital;

  return (
    <>
      <HoverPreview state={hover} />

      {digital.length > 0 && (
        <>
          <SubLabel>Digital</SubLabel>
          <div role="list" className="flex flex-col">
            {displayDigital.map((p) => (
              <ProjectRow
                key={p.name}
                project={p}
                onEnter={onEnter}
                onMove={onMove}
                onLeave={onLeave}
              />
            ))}
          </div>
        </>
      )}

      {physical.length > 0 && (
        <>
          <SubLabel>Physical</SubLabel>
          <div role="list" className="flex flex-col">
            {physical.map((p) => (
              <ProjectRow
                key={p.name}
                project={p}
                onEnter={onEnter}
                onMove={onMove}
                onLeave={onLeave}
              />
            ))}
          </div>
        </>
      )}
    </>
  );
}
